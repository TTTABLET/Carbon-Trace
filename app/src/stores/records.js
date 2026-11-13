import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  addRecord as dbAdd,
  deleteRecord as dbDelete,
  getAllRecords,
  clearAllRecords,
  getSetting,
  setSetting,
  getProfile,
  saveProfile,
  getGrowth,
  saveGrowth,
  isSeeded,
  markSeeded,
} from '../core/db.js'
import {
  calcTotal,
  calcByCategory,
  calcDailySeries,
  calcStreak,
  toEquivalents,
  getRating,
  toDateKey,
  round,
} from '../core/calculator.js'
import { buildLeaderboard } from '../core/leaderboard.js'
import { getEcoStatus, getHourlyAqi, getWeeklyAqi } from '../core/ecoStatus.js'
import {
  growthSummary,
  water,
  rewardsFromSavings,
  MAX_STAGE,
  TREE_STAGES,
  TREE_TOTAL_COST,
  unlockedSpecies,
  speciesById,
  dailyYield,
  countCompleted,
  UNLOCK_STAGE,
  FRUIT_DAILY_YIELD,
} from '../core/growth.js'
import { buildFriends, sortFriends } from '../core/friends.js'

export const useRecordsStore = defineStore('records', () => {
  const records = ref([])
  const gridRegion = ref('national')
  const cityId = ref('beijing')
  const profile = ref({ name: null, avatar: '🙋' })
  const growth = ref({
    xp: 0,
    energy: 0,
    trees: [],
    totalSaved: 0,
    treesCompleted: 0,
    lastRewardDate: null,
    lastYieldDate: null,
    waterLog: [],
  })
  const loaded = ref(false)
  /** 调试用日期偏移天数, 0 表示跟随系统时间 */
  const dayOffset = ref(0)

  async function load() {
    records.value = await getAllRecords()
    gridRegion.value = await getSetting('gridRegion', 'national')
    cityId.value = await getSetting('cityId', 'beijing')
    dayOffset.value = await getSetting('dayOffset', 0)
    profile.value = await getProfile()
    growth.value = await getGrowth()
    loaded.value = true
  }

  async function add(record) {
    await dbAdd({ ...record, gridRegion: record.gridRegion || gridRegion.value })
    records.value = await getAllRecords()
  }

  async function remove(id) {
    await dbDelete(id)
    records.value = await getAllRecords()
  }

  async function clear() {
    await clearAllRecords()
    records.value = []
    await debugResetGrowth()
  }

  async function setGrid(region) {
    gridRegion.value = region
    await setSetting('gridRegion', region)
  }

  async function setCity(id) {
    cityId.value = id
    await setSetting('cityId', id)
  }

  async function updateProfile(p) {
    profile.value = { ...profile.value, ...p }
    await saveProfile(profile.value)
  }

  /**
   * 首次启动时初始化示例数据标记
   *
   * 示例画像数据由 leaderboard.js 按需确定性生成, 不写入 records 表,
   * 避免与用户自己的记录混在一起。
   */
  async function ensureSeeded() {
    if (await isSeeded()) return false
    await markSeeded()
    return true
  }

  // ---------- 成长系统 ----------

  const todayKey = computed(() => toDateKey(new Date(Date.now() + dayOffset.value * 86400000)))

  /** 调试: 快进/回退天数, 快进时为跳过的每一天补一条零排放记录以延续连续记录 */
  async function debugSetDayOffset(days) {
    const next = Math.max(0, Math.round(days) || 0)
    const prev = dayOffset.value
    dayOffset.value = next
    await setSetting('dayOffset', next)

    if (next > prev) {
      const existing = new Set(records.value.map((r) => r.date))
      const base = Date.now() + prev * 86400000
      for (let i = 1; i <= next - prev; i++) {
        const key = toDateKey(new Date(base + i * 86400000))
        if (existing.has(key)) continue
        await dbAdd({
          date: key,
          category: 'transport',
          activity: 'walk',
          amount: 0,
          gridRegion: gridRegion.value,
        })
      }
      records.value = await getAllRecords()
    }
    return next
  }

  /** 深拷贝成普通对象后落库 (Dexie 无法存储 Vue reactive Proxy) */
  async function persist(next) {
    growth.value = next
    await saveGrowth(JSON.parse(JSON.stringify(next)))
  }

  /** 生成一棵新树 */
  function makeTree(speciesId = 'common', index = 0) {
    return {
      id: `tree-${Date.now()}-${index}`,
      speciesId,
      stage: 0,
      progress: 0,
      name: null,
      plantedAt: Date.now(),
    }
  }

  /**
   * 结算减排奖励
   *
   * 以「基准排放 - 实际排放」的差值作为减排量, 换算成 XP 和绿色能量。
   * 基准取中国人均日排放 21.9 kgCO2e。
   */
  async function settleRewards(baseline = 21.9) {
    const active = activeDays.value
    if (active === 0) return { xp: 0, ge: 0, saved: 0 }

    const saved = Math.max(0, round(baseline * active - total.value, 2))
    const already = growth.value.totalSaved || 0
    const delta = round(saved - already, 2)

    if (delta <= 0) return { xp: 0, ge: 0, saved: 0 }

    const r = rewardsFromSavings(delta)
    const next = {
      ...growth.value,
      xp: growth.value.xp + r.xp,
      energy: growth.value.energy + r.ge,
      totalSaved: saved,
      lastRewardDate: todayKey.value,
    }
    await persist(next)
    return { ...r, saved: delta }
  }

  /**
   * 果树每日产出结算
   *
   * 已长成的果树每天产出绿色能量, 同一天只结算一次。
   */
  async function collectYield() {
    const g = growth.value
    const amount = dailyYield(g.trees)
    if (amount <= 0) return { ok: false, reason: 'no-yield', amount: 0 }
    if (g.lastYieldDate === todayKey.value) return { ok: false, reason: 'collected', amount: 0 }

    const next = {
      ...g,
      energy: g.energy + amount,
      lastYieldDate: todayKey.value,
    }
    await persist(next)
    return { ok: true, amount }
  }

  /**
   * 浇灌当前正在成长的那棵树
   * @param {number} amount 投入的绿色能量
   */
  async function waterTree(amount) {
    const g = growth.value
    if (g.energy <= 0) return { ok: false, reason: 'no-energy' }

    const trees = [...(g.trees || [])]
    let idx = trees.findIndex((t) => t.stage < MAX_STAGE)
    if (idx === -1) return { ok: false, reason: 'max-stage' }

    const target = trees[idx]
    const result = water(target.stage, target.progress, g.energy, amount)
    if (result.spent <= 0) return { ok: false, reason: 'no-energy' }

    trees[idx] = { ...target, stage: result.stage, progress: result.progress }

    const log = [
      ...(g.waterLog || []),
      { date: todayKey.value, amount: result.spent, at: Date.now() },
    ].slice(-50)

    const next = {
      ...g,
      energy: g.energy - result.spent,
      trees,
      treesCompleted: countCompleted(trees),
      waterLog: log,
    }
    await persist(next)
    return { ok: true, ...result, treeId: target.id }
  }

  /**
   * 给指定的某一棵树浇水
   */
  async function waterTreeById(treeId, amount) {
    const g = growth.value
    if (g.energy <= 0) return { ok: false, reason: 'no-energy' }

    const trees = [...(g.trees || [])]
    const idx = trees.findIndex((t) => t.id === treeId)
    if (idx === -1) return { ok: false, reason: 'not-found' }

    const target = trees[idx]
    if (target.stage >= MAX_STAGE) return { ok: false, reason: 'max-stage' }

    const result = water(target.stage, target.progress, g.energy, amount)
    if (result.spent <= 0) return { ok: false, reason: 'no-energy' }

    trees[idx] = { ...target, stage: result.stage, progress: result.progress }

    const log = [
      ...(Array.isArray(g.waterLog) ? g.waterLog : []),
      { date: todayKey.value, amount: result.spent, at: Date.now() },
    ].slice(-50)

    const next = {
      ...g,
      energy: g.energy - result.spent,
      trees,
      treesCompleted: countCompleted(trees),
      waterLog: log,
    }
    await persist(next)
    return { ok: true, ...result, treeId }
  }

  /**
   * 种下一棵新树
   * @param {string} speciesId 树种 id, 未解锁时回退到普通树
   */
  async function plantTree(speciesId = 'common') {
    const g = growth.value
    const allowed = unlockedSpecies(growthInfo.value.treesCompleted).map((s) => s.id)
    const pick = allowed.includes(speciesId) ? speciesId : 'common'

    const trees = [...(g.trees || []), makeTree(pick, (g.trees || []).length)]
    const next = { ...g, trees }
    await persist(next)
    return { ok: true, species: speciesById(pick), treeId: trees[trees.length - 1].id }
  }

  /**
   * 给树改名
   */
  async function renameTree(treeId, name) {
    const g = growth.value
    const trees = (g.trees || []).map((t) => (t.id === treeId ? { ...t, name } : t))
    await persist({ ...g, trees })
    return { ok: true }
  }

  // ---------- 调试工具 ----------

  /** 一键增加成长数值 (增量累加) */
  async function debugAddGrowth(patch = {}) {
    const g = growth.value
    const next = { ...g }
    const addXp = Math.max(0, Math.round(Number(patch.xp) || 0))
    const addEnergy = Math.max(0, Math.round(Number(patch.energy) || 0))
    const addTrees = Math.max(0, Math.round(Number(patch.trees) || 0))

    next.xp = (g.xp || 0) + addXp
    next.energy = (g.energy || 0) + addEnergy

    if (addTrees > 0) {
      const trees = [...(g.trees || [])]
      for (let i = 0; i < addTrees; i++) {
        trees.push({
          id: `dbg-add-${Date.now()}-${i}`,
          speciesId: 'common',
          stage: UNLOCK_STAGE,
          progress: 0,
          name: null,
          plantedAt: Date.now(),
        })
      }
      next.trees = trees
      next.treesCompleted = countCompleted(trees)
    }

    await persist(next)
    return { ok: true, xp: next.xp, energy: next.energy, trees: (next.trees || []).length }
  }

  /** 按减排量反推 XP / 能量 / 已种成树数 */
  async function debugSetSaved(saved) {
    const s = Math.max(0, Number(saved) || 0)
    const r = rewardsFromSavings(s)
    const completed = Math.floor(r.ge / TREE_TOTAL_COST)
    const leftover = r.ge - completed * TREE_TOTAL_COST
    const g = growth.value
    const pool = unlockedSpecies(completed)
    const trees = []
    for (let i = 0; i < completed; i++) {
      trees.push({
        id: `dbg-${Date.now()}-${i}`,
        speciesId: pool[i % pool.length].id,
        stage: MAX_STAGE,
        progress: 0,
        name: null,
        plantedAt: Date.now(),
      })
    }
    if (leftover > 0) {
      let stage = 0
      let rest = leftover
      for (let i = 1; i < TREE_STAGES.length; i++) {
        const inc = TREE_STAGES[i].cost - TREE_STAGES[i - 1].cost
        if (rest >= inc) { rest -= inc; stage++ } else break
      }
      trees.push({
        id: `dbg-${Date.now()}-g`,
        speciesId: pool[pool.length - 1].id,
        stage: Math.min(stage, MAX_STAGE),
        progress: stage >= MAX_STAGE ? 0 : rest,
        name: null,
        plantedAt: Date.now(),
      })
    }
    await persist({
      ...g,
      xp: r.xp,
      energy: leftover,
      totalSaved: s,
      treesCompleted: countCompleted(trees),
      trees,
      lastRewardDate: null,
      lastYieldDate: null,
    })
    return { ok: true, xp: r.xp, energy: leftover, treesCompleted: countCompleted(trees) }
  }

  /** 自定义添加树: 指定树种 / 阶段 / 数量 */
  async function debugAddTrees(speciesId = 'common', stage = MAX_STAGE, count = 1) {
    const g = growth.value
    const n = Math.max(1, Math.min(60, Math.round(count)))
    const st = Math.max(0, Math.min(MAX_STAGE, Math.round(stage)))
    const trees = [...(g.trees || [])]
    for (let i = 0; i < n; i++) {
      trees.push({
        id: `dbg-add-${Date.now()}-${i}`,
        speciesId,
        stage: st,
        progress: 0,
        name: null,
        plantedAt: Date.now(),
      })
    }
    await persist({ ...g, trees, treesCompleted: countCompleted(trees) })
    return { ok: true, total: trees.length }
  }

  /** 一键种满所有已解锁树种 */
  async function debugPlantAll() {
    const g = growth.value
    const pool = unlockedSpecies(growthInfo.value.treesCompleted)
    const trees = pool.map((sp, i) => ({
      id: `dbg-all-${Date.now()}-${i}`,
      speciesId: sp.id,
      stage: MAX_STAGE,
      progress: 0,
      name: null,
      plantedAt: Date.now(),
    }))
    await persist({ ...g, trees, treesCompleted: countCompleted(trees) })
    return { ok: true, count: trees.length }
  }

  /** 清空成长数据 */
  async function debugResetGrowth() {
    await persist({
      xp: 0,
      energy: 0,
      trees: [],
      totalSaved: 0,
      treesCompleted: 0,
      lastRewardDate: null,
      lastYieldDate: null,
      waterLog: [],
    })
    return { ok: true }
  }

  const growthInfo = computed(() => growthSummary(growth.value))

  /** 已解锁的树种 */
  const unlockedTreeSpecies = computed(() => unlockedSpecies(growthInfo.value.treesCompleted))

  /** 当前可浇灌的树 (第一棵未长成的) */
  const activeTree = computed(
    () => (growth.value.trees || []).find((t) => t.stage < MAX_STAGE) || null,
  )

  /** 今日果树产出是否已领取 */
  const yieldCollected = computed(() => growth.value.lastYieldDate === todayKey.value)

  /** 今日可领取的果树产出 */
  const pendingYield = computed(() =>
    yieldCollected.value ? 0 : dailyYield(growth.value.trees),
  )

  // ---------- 好友 ----------

  const friends = computed(() => sortFriends(buildFriends(30)))

  const myRankAmongFriends = computed(() => {
    const all = [...friends.value, { id: 'me', xp: growth.value.xp, isMe: true }]
    all.sort((a, b) => b.xp - a.xp)
    return all.findIndex((f) => f.isMe) + 1
  })

  // ---------- 派生数据 ----------

  const todayRecords = computed(() => records.value.filter((r) => r.date === todayKey.value))
  const todayTotal = computed(() => calcTotal(todayRecords.value))
  const total = computed(() => calcTotal(records.value))
  const byCategory = computed(() => calcByCategory(records.value))
  const dailySeries = computed(() => calcDailySeries(records.value, 30, todayKey.value))

  const weekTotal = computed(() =>
    round(dailySeries.value.slice(-7).reduce((a, b) => a + b.total, 0), 2),
  )
  const monthTotal = computed(() =>
    round(dailySeries.value.slice(-30).reduce((a, b) => a + b.total, 0), 2),
  )

  const activeDays = computed(() => new Set(records.value.map((r) => r.date)).size)
  const dailyAvg = computed(() =>
    activeDays.value === 0 ? 0 : round(total.value / activeDays.value, 2),
  )
  const streak = computed(() => calcStreak(records.value, todayKey.value))
  const equivalents = computed(() => toEquivalents(total.value))
  const rating = computed(() => getRating(dailyAvg.value))

  // ---------- 排行榜 ----------

  const leaderboard = computed(() => buildLeaderboard(records.value, profile.value, 30, todayKey.value))

  // ---------- 生态状况 ----------

  const ecoStatus = computed(() => getEcoStatus(cityId.value, todayKey.value))
  const hourlyAqi = computed(() => getHourlyAqi(cityId.value, todayKey.value))
  const weeklyAqi = computed(() => getWeeklyAqi(cityId.value, todayKey.value))

  return {
    records,
    gridRegion,
    cityId,
    profile,
    growth,
    loaded,
    dayOffset,
    load,
    add,
    remove,
    clear,
    setGrid,
    setCity,
    updateProfile,
    ensureSeeded,
    settleRewards,
    collectYield,
    waterTree,
    waterTreeById,
    plantTree,
    renameTree,
    debugAddGrowth,
    debugSetSaved,
    debugAddTrees,
    debugPlantAll,
    debugResetGrowth,
    debugSetDayOffset,
    growthInfo,
    unlockedTreeSpecies,
    activeTree,
    yieldCollected,
    pendingYield,
    friends,
    myRankAmongFriends,
    todayKey,
    todayRecords,
    todayTotal,
    total,
    byCategory,
    dailySeries,
    weekTotal,
    monthTotal,
    activeDays,
    dailyAvg,
    streak,
    equivalents,
    rating,
    leaderboard,
    ecoStatus,
    hourlyAqi,
    weeklyAqi,
  }
})