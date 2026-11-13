/**
 * 成长系统核心逻辑
 *
 * 把减排量转化为两种资源:
 *   - 经验值 XP: 决定等级, 只增不减
 *   - 绿色能量 GE: 用于浇灌树苗, 会被消耗
 *
 * 换算比例: 每减排 1 kgCO2e 获得 10 XP + 5 GE
 *
 * 树园模型: 用户可以一棵一棵地种树, 每棵树独立成长。
 * 累计种成的树越多, 可解锁的树种越丰富 (普通树 -> 果树 -> 花树 -> 竹林)。
 */

/** 每 kgCO2e 减排量对应的经验值 */
export const XP_PER_KG = 10

/** 每 kgCO2e 减排量对应的绿色能量 */
export const GE_PER_KG = 5

/**
 * 等级曲线
 * 升到第 n 级所需累计 XP = 100 * n^1.5 (取整到 10)
 * 这样前期升级快, 后期逐渐变慢
 */
export function xpForLevel(level) {
  if (level <= 1) return 0
  return Math.round((100 * Math.pow(level - 1, 1.5)) / 10) * 10
}

/**
 * 根据累计 XP 反推当前等级
 */
export function levelFromXp(xp) {
  let level = 1
  while (level < 99 && xp >= xpForLevel(level + 1)) {
    level++
  }
  return level
}

/**
 * 等级进度信息
 */
export function levelProgress(xp) {
  const level = levelFromXp(xp)
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const span = next - current
  const gained = xp - current
  return {
    level,
    xp,
    currentLevelXp: current,
    nextLevelXp: next,
    gained,
    span,
    remaining: Math.max(0, next - xp),
    percent: span > 0 ? Math.min(100, Math.round((gained / span) * 100)) : 100,
  }
}

/**
 * 等级称号
 */
export const LEVEL_TITLES = [
  { min: 1, zh: '环保新手', en: 'Eco Newbie', icon: '🌱' },
  { min: 3, zh: '低碳学徒', en: 'Low-Carbon Apprentice', icon: '🌿' },
  { min: 6, zh: '绿色行者', en: 'Green Walker', icon: '🍀' },
  { min: 10, zh: '减碳达人', en: 'Carbon Cutter', icon: '🌳' },
  { min: 15, zh: '生态卫士', en: 'Eco Guardian', icon: '🛡️' },
  { min: 22, zh: '气候先锋', en: 'Climate Pioneer', icon: '⚡' },
  { min: 30, zh: '地球守护者', en: 'Earth Keeper', icon: '🌍' },
  { min: 45, zh: '碳中和大师', en: 'Carbon Neutral Master', icon: '👑' },
]

export function levelTitle(level) {
  let title = LEVEL_TITLES[0]
  for (const t of LEVEL_TITLES) {
    if (level >= t.min) title = t
  }
  return title
}

/**
 * 单棵树的成长阶段
 *
 * 满级 (大树) 需要 300 点绿色能量, 生长周期短、反馈密集。
 * 各阶段累计成本: 0 / 30 / 120 / 300
 */
export const TREE_STAGES = [
  { stage: 0, key: 'seed', cost: 0, zh: '种子', en: 'Seed' },
  { stage: 1, key: 'sprout', cost: 30, zh: '幼苗', en: 'Sprout' },
  { stage: 2, key: 'sapling', cost: 120, zh: '小树', en: 'Sapling' },
  { stage: 3, key: 'mature', cost: 300, zh: '大树', en: 'Mature Tree' },
]

export const MAX_STAGE = TREE_STAGES.length - 1

/** 单棵树长到大树所需的总能量 */
export const TREE_TOTAL_COST = TREE_STAGES[MAX_STAGE].cost

/**
 * 树种定义
 *
 * 每个树种有 4 个阶段的图标 (种子/幼苗阶段各树种一致, 从小树阶段开始分化外观)。
 * unlockAt 表示「累计长到小树及以上的树达到多少棵」时解锁。
 */
export const TREE_SPECIES = [
  {
    id: 'common',
    unlockAt: 0,
    zh: '普通树',
    en: 'Common Tree',
    desc: { zh: '最朴实的绿意，从一棵开始', en: 'The humblest green — start with one' },
    icons: ['🌰', '🌱', '🌿', '🌳'],
    color: '#2e9e5b',
  },
  {
    id: 'apple',
    unlockAt: 2,
    zh: '苹果树',
    en: 'Apple Tree',
    desc: { zh: '开花结果，甜的是坚持', en: 'Blossoms and fruit — sweet persistence' },
    icons: ['🌰', '🌱', '🌿', '🍎'],
    color: '#e05252',
  },
  {
    id: 'orange',
    unlockAt: 3,
    zh: '橘子树',
    en: 'Orange Tree',
    desc: { zh: '阳光晒足，果实才够甜', en: 'Plenty of sun makes it sweet' },
    icons: ['🌰', '🌱', '🌿', '🍊'],
    color: '#f08c1e',
  },
  {
    id: 'cherry',
    unlockAt: 4,
    zh: '樱花树',
    en: 'Cherry Blossom',
    desc: { zh: '一树花开，春天会记得你', en: 'A tree in bloom — spring remembers you' },
    icons: ['🌰', '🌱', '🌿', '🌸'],
    color: '#e87ba8',
  },
  {
    id: 'peach',
    unlockAt: 5,
    zh: '桃树',
    en: 'Peach Tree',
    desc: { zh: '桃之夭夭，灼灼其华', en: 'Radiant blossoms, abundant fruit' },
    icons: ['🌰', '🌱', '🌿', '🍑'],
    color: '#f2a0b5',
  },
  {
    id: 'bamboo',
    unlockAt: 6,
    zh: '竹林',
    en: 'Bamboo Grove',
    desc: { zh: '节节高升，清风自来', en: 'Rising joint by joint, the breeze follows' },
    icons: ['🌰', '🌱', '🌿', '🎋'],
    color: '#4a9e6f',
  },
  {
    id: 'maple',
    unlockAt: 7,
    zh: '枫树',
    en: 'Maple Tree',
    desc: { zh: '秋来满树红，是坚持的颜色', en: 'Autumn red — the color of persistence' },
    icons: ['🌰', '🌱', '🌿', '🍁'],
    color: '#d4552b',
  },
  {
    id: 'pine',
    unlockAt: 8,
    zh: '松树',
    en: 'Pine Tree',
    desc: { zh: '四季常青，风雨不改', en: 'Evergreen through every season' },
    icons: ['🌰', '🌱', '🌿', '🌲'],
    color: '#1f7a4d',
  },
]

/** 按解锁条件排序的树种列表 */
export const SPECIES_BY_UNLOCK = [...TREE_SPECIES].sort((a, b) => a.unlockAt - b.unlockAt)

/**
 * 解锁门槛对应的阶段: 长到「小树」即计入解锁进度
 */
export const UNLOCK_STAGE = 2

/**
 * 统计已长成的树 (达到最高阶段) 数量
 */
export function countMature(trees = []) {
  return trees.filter((t) => (t.stage || 0) >= MAX_STAGE).length
}

/**
 * 统计计入解锁进度的树 (达到「小树」及以上) 数量
 *
 * 解锁进度以实际树状态为准, 而不是依赖单独维护的计数器,
 * 避免计数器与实际树列表不同步导致解锁状态错误。
 */
export function countCompleted(trees = []) {
  return trees.filter((t) => (t.stage || 0) >= UNLOCK_STAGE).length
}

/**
 * 根据「累计种成的树」数量, 返回已解锁的树种
 */
export function unlockedSpecies(treesCompleted = 0) {
  return TREE_SPECIES.filter((s) => treesCompleted >= s.unlockAt)
}

/**
 * 下一个待解锁的树种 (没有则返回 null)
 */
export function nextSpecies(treesCompleted = 0) {
  return SPECIES_BY_UNLOCK.find((s) => treesCompleted < s.unlockAt) || null
}

/**
 * 按 id 取树种, 找不到时回退到普通树
 */
export function speciesById(id) {
  return TREE_SPECIES.find((s) => s.id === id) || TREE_SPECIES[0]
}

/**
 * 计算浇灌到下一阶段需要多少能量
 */
export function nextStageCost(stage) {
  if (stage >= MAX_STAGE) return 0
  return TREE_STAGES[stage + 1].cost - TREE_STAGES[stage].cost
}

/**
 * 单棵树的完整状态
 * @param {number} stage 当前阶段
 * @param {number} progress 当前阶段已投入的能量
 * @param {string} speciesId 树种 id
 */
export function treeState(stage, progress = 0, speciesId = 'common') {
  const s = Math.max(0, Math.min(MAX_STAGE, stage))
  const info = TREE_STAGES[s]
  const species = speciesById(speciesId)
  const cost = nextStageCost(s)
  const isMax = s >= MAX_STAGE
  return {
    stage: s,
    key: info.key,
    icon: species.icons[s],
    speciesId: species.id,
    species,
    name: { zh: info.zh, en: info.en },
    progress,
    cost,
    isMax,
    percent: isMax ? 100 : cost > 0 ? Math.min(100, Math.round((progress / cost) * 100)) : 0,
    remaining: isMax ? 0 : Math.max(0, cost - progress),
    // 整棵树的总进度 (相对 600 能量)
    totalPercent: Math.min(100, Math.round(((info.cost + progress) / TREE_TOTAL_COST) * 100)),
  }
}

/**
 * 浇灌一次
 * @param {number} stage 当前阶段
 * @param {number} progress 当前阶段进度
 * @param {number} energy 可用能量
 * @param {number} amount 想投入的能量
 * @returns {Object} { stage, progress, spent, leveledUp, completed }
 */
export function water(stage, progress, energy, amount) {
  let s = stage
  let p = progress
  let remaining = Math.min(amount, energy)
  let spent = 0
  let leveledUp = false
  let completed = false

  while (remaining > 0 && s < MAX_STAGE) {
    const need = nextStageCost(s) - p
    if (remaining >= need) {
      remaining -= need
      spent += need
      p = 0
      s++
      leveledUp = true
      if (s >= MAX_STAGE) {
        completed = true
        break
      }
    } else {
      p += remaining
      spent += remaining
      remaining = 0
    }
  }

  return { stage: s, progress: p, spent, leveledUp, completed }
}

/**
 * 从减排量计算应得的 XP 和 GE
 * @param {number} savedKg 减排量 (kgCO2e)
 */
export function rewardsFromSavings(savedKg) {
  const kg = Math.max(0, Number(savedKg) || 0)
  return {
    xp: Math.round(kg * XP_PER_KG),
    ge: Math.round(kg * GE_PER_KG),
  }
}

/**
 * 果树每日产出
 *
 * 已长成的果树 (非普通树) 每天产出少量绿色能量, 形成
 * 「种树 -> 收获 -> 再种树」的正向循环。
 */
export const FRUIT_DAILY_YIELD = 5

/**
 * 计算果树每日产出总量
 * @param {Array} trees 树列表
 */
export function dailyYield(trees = []) {
  return (
    trees.filter((t) => t.stage >= MAX_STAGE && t.speciesId !== 'common').length * FRUIT_DAILY_YIELD
  )
}

/**
 * 汇总成长数据
 * @param {Object} state { xp, energy, trees, totalSaved, treesCompleted }
 */
export function growthSummary(state) {
  const xp = state.xp || 0
  const energy = state.energy || 0
  const trees = state.trees || []
  // 解锁进度以实际树状态为准, 计数器仅作为旧数据的兜底
  const treesCompleted = Math.max(countCompleted(trees), state.treesCompleted || 0)
  const prog = levelProgress(xp)

  const active = trees.find((t) => t.stage < MAX_STAGE) || null
  const current = active
    ? treeState(active.stage, active.progress, active.speciesId)
    : treeState(MAX_STAGE, 0, trees.length ? trees[trees.length - 1].speciesId : 'common')

  return {
    ...prog,
    title: levelTitle(prog.level),
    energy,
    tree: current,
    trees,
    treeCount: trees.length,
    grownCount: countMature(trees),
    totalSaved: state.totalSaved || 0,
    treesCompleted,
    unlocked: unlockedSpecies(treesCompleted),
    nextSpecies: nextSpecies(treesCompleted),
    dailyYield: dailyYield(trees),
    // 距离下一等级还差多少减排量
    kgToNextLevel: Math.ceil(prog.remaining / XP_PER_KG),
  }
}
