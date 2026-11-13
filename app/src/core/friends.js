/**
 * 好友系统
 *
 * 6 个模拟好友, 复用 seedData 的画像数据
 * 每个好友有自己的等级、能量和树林状态, 由确定性算法生成
 */

import { PERSONAS, generatePersonaRecords } from './seedData.js'
import { calcTotal } from './calculator.js'
import {
  levelFromXp,
  levelTitle,
  treeState,
  rewardsFromSavings,
  MAX_STAGE,
  TREE_TOTAL_COST,
  TREE_SPECIES,
  unlockedSpecies,
} from './growth.js'

/**
 * 好友的社交属性 (与画像一一对应)
 */
const SOCIAL = {
  'green-hero': {
    motto: { zh: '骑车上班第 300 天，风都是甜的', en: 'Day 300 of cycling to work' },
    joinedDays: 420,
    online: true,
  },
  'office-worker': {
    motto: { zh: '地铁上刷手机，比开车刷手机环保', en: 'Subway scrolling beats car scrolling' },
    joinedDays: 260,
    online: true,
  },
  'meat-lover': {
    motto: { zh: '正在努力把牛排换成鸡胸肉', en: 'Trying to swap steak for chicken' },
    joinedDays: 95,
    online: false,
  },
  'takeout-king': {
    motto: { zh: '自带饭盒第 12 天，坚持住', en: 'Day 12 of bringing my own lunchbox' },
    joinedDays: 78,
    online: true,
  },
  'car-owner': {
    motto: { zh: '这周有两天坐地铁了，进步', en: 'Took the subway twice this week' },
    joinedDays: 150,
    online: false,
  },
  newbie: {
    motto: { zh: '刚下载，先看看别人怎么做的', en: 'Just joined, learning from others' },
    joinedDays: 12,
    online: true,
  },
}

/**
 * 确定性伪随机 (与 seedData 保持一致)
 */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 生成一个好友的完整档案
 */
export function buildFriend(persona, days = 30) {
  const social = SOCIAL[persona.id] || {
    motto: { zh: '', en: '' },
    joinedDays: 30,
    online: false,
  }

  const records = generatePersonaRecords(persona, days)
  const total = calcTotal(records)
  const activeDays = Math.max(1, new Set(records.map((r) => r.date)).size)

  // 减排量 = 基准排放 - 实际排放 (基准取中国人均日排放 21.9 kgCO2e)
  const BASELINE = 21.9
  const savedPerDay = Math.max(0, BASELINE - total / activeDays)

  // 用确定性随机模拟历史积累 (好友加入更早, 数据更多)
  const rng = mulberry32(hashString('friend-' + persona.id))
  // 历史系数: 加入越久积累越多, 但收敛到 3 倍以内, 避免等级虚高
  const historyFactor = Math.min(3, 1 + Math.log10(Math.max(1, social.joinedDays / 30)) * 1.6)
  const lifetimeSaved = Math.round(savedPerDay * activeDays * historyFactor * (0.85 + rng() * 0.3) * 10) / 10

  const rewards = rewardsFromSavings(lifetimeSaved)
  const xp = rewards.xp
  const level = levelFromXp(xp)

  // 好友的能量: 一部分已投入树木, 一部分留存
  const totalEnergy = rewards.ge
  const invested = Math.round(totalEnergy * (0.55 + rng() * 0.3))
  const energy = Math.max(0, totalEnergy - invested)

  // 完成的树数量 (每棵树长到大树需要 TREE_TOTAL_COST 点能量)
  const treesCompleted = Math.floor(invested / TREE_TOTAL_COST)
  const leftover = invested - treesCompleted * TREE_TOTAL_COST

  // 好友的树林: 已长成的树按解锁顺序分配树种, 再补一棵正在成长的
  const speciesPool = unlockedSpecies(treesCompleted)
  const trees = []
  for (let i = 0; i < treesCompleted; i++) {
    const sp = speciesPool[i % speciesPool.length]
    trees.push({
      id: `${persona.id}-t${i + 1}`,
      speciesId: sp.id,
      stage: MAX_STAGE,
      progress: 0,
      name: null,
    })
  }

  // 正在成长的那棵树
  let stage = 0
  let progress = 0
  let rest = leftover
  const costs = [40, 70, 120, 170, 200]
  for (const c of costs) {
    if (rest >= c) {
      rest -= c
      stage++
    } else {
      progress = rest
      break
    }
  }
  if (stage >= MAX_STAGE) {
    stage = MAX_STAGE
    progress = 0
  }

  const growingSpecies = speciesPool[speciesPool.length - 1] || TREE_SPECIES[0]
  if (stage > 0 || progress > 0) {
    trees.push({
      id: `${persona.id}-growing`,
      speciesId: growingSpecies.id,
      stage: Math.max(1, stage),
      progress,
      name: null,
    })
  }

  return {
    id: persona.id,
    name: persona.name,
    avatar: persona.avatar,
    tagline: persona.tagline,
    desc: persona.desc,
    color: persona.color,
    motto: social.motto,
    joinedDays: social.joinedDays,
    online: social.online,
    // 成长数据
    xp,
    level,
    title: levelTitle(level),
    energy,
    stage,
    progress,
    tree: treeState(stage, progress, growingSpecies.id),
    trees,
    treeCount: trees.length,
    speciesCount: new Set(trees.map((t) => t.speciesId)).size,
    treesCompleted,
    lifetimeSaved,
    dailyAvg: Math.round((total / activeDays) * 100) / 100,
    streak: days,
  }
}

/**
 * 生成全部好友
 */
export function buildFriends(days = 30) {
  return PERSONAS.map((p) => buildFriend(p, days))
}

/**
 * 按等级排序
 */
export function sortFriends(friends) {
  return [...friends].sort((a, b) => b.xp - a.xp)
}
