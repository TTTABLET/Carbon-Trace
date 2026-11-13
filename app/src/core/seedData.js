/**
 * 预置示例用户数据
 *
 * 目的: 展示不同生活状态下的碳足迹差异, 起到倡导绿色生活的作用
 * 数据为模拟生成, 首次打开应用时写入
 */

import { toDateKey } from './calculator.js'

/**
 * 典型用户画像
 * dailyTarget: 日均排放目标 (kgCO2e)
 * 排放水平参考: 全球目标 6.3 / 世界人均 12.9 / 中国人均 21.9
 */
export const PERSONAS = [
  {
    id: 'green-hero',
    name: { zh: '林小绿', en: 'Lin Xiaolv' },
    avatar: '🌿',
    tagline: { zh: '低碳生活践行者', en: 'Low-carbon practitioner' },
    desc: {
      zh: '骑车通勤、素食为主、几乎不点外卖',
      en: 'Cycles to work, mostly vegetarian, rarely orders takeout',
    },
    dailyTarget: 4.2,
    color: '#2e9e5b',
    isMe: false,
  },
  {
    id: 'office-worker',
    name: { zh: '陈通勤', en: 'Chen Tongqin' },
    avatar: '💼',
    tagline: { zh: '地铁通勤白领', en: 'Subway commuter' },
    desc: {
      zh: '每天地铁上下班，饮食均衡，偶尔打车',
      en: 'Takes the subway daily, balanced diet, occasional taxi',
    },
    dailyTarget: 9.8,
    color: '#4A90D9',
    isMe: false,
  },
  {
    id: 'meat-lover',
    name: { zh: '王大肉', en: 'Wang Darou' },
    avatar: '🥩',
    tagline: { zh: '无肉不欢', en: 'Meat enthusiast' },
    desc: {
      zh: '每餐必有红肉，开车出行，空调常开',
      en: 'Red meat every meal, drives everywhere, AC always on',
    },
    dailyTarget: 28.5,
    color: '#d9534f',
    isMe: false,
  },
  {
    id: 'takeout-king',
    name: { zh: '李外卖', en: 'Li Waimai' },
    avatar: '🍱',
    tagline: { zh: '外卖重度用户', en: 'Heavy takeout user' },
    desc: {
      zh: '一日三餐全靠外卖，快递包裹堆成山',
      en: 'All meals delivered, mountains of packages',
    },
    dailyTarget: 19.6,
    color: '#F5A623',
    isMe: false,
  },
  {
    id: 'car-owner',
    name: { zh: '赵有车', en: 'Zhao Youche' },
    avatar: '🚗',
    tagline: { zh: '自驾通勤族', en: 'Daily driver' },
    desc: {
      zh: '单程 25 公里自驾，周末常出游',
      en: 'Drives 25 km each way, weekend road trips',
    },
    dailyTarget: 24.3,
    color: '#BD10E0',
    isMe: false,
  },
  {
    id: 'newbie',
    name: { zh: '孙新手', en: 'Sun Xinshou' },
    avatar: '🌱',
    tagline: { zh: '刚开始关注环保', en: 'Just started caring' },
    desc: {
      zh: '正在尝试减少一次性塑料和食物浪费',
      en: 'Trying to cut single-use plastic and food waste',
    },
    dailyTarget: 14.7,
    color: '#7ED321',
    isMe: false,
  },
]

/**
 * 每个画像的日常活动模板
 * 用于生成 30 天的记录
 */
const ACTIVITY_TEMPLATES = {
  'green-hero': [
    { category: 'transport', activity: 'bike', amount: [8, 12] },
    { category: 'transport', activity: 'subway', amount: [0, 6] },
    { category: 'energy', activity: 'electricity', amount: [2.5, 4.0] },
    { category: 'diet', activity: 'vegetables', amount: [0.6, 1.0] },
    { category: 'diet', activity: 'rice', amount: [0.3, 0.5] },
    { category: 'diet', activity: 'eggs', amount: [0.1, 0.2] },
  ],
  'office-worker': [
    { category: 'transport', activity: 'subway', amount: [18, 24] },
    { category: 'transport', activity: 'taxi', amount: [0, 5] },
    { category: 'energy', activity: 'electricity', amount: [4, 6] },
    { category: 'diet', activity: 'rice', amount: [0.5, 0.8] },
    { category: 'diet', activity: 'poultry', amount: [0.2, 0.4] },
    { category: 'diet', activity: 'vegetables', amount: [0.4, 0.7] },
    { category: 'consumption', activity: 'package', amount: [0, 2] },
  ],
  'meat-lover': [
    { category: 'transport', activity: 'carGasoline', amount: [30, 45] },
    { category: 'energy', activity: 'electricity', amount: [10, 16] },
    { category: 'energy', activity: 'naturalGas', amount: [0.8, 1.5] },
    { category: 'diet', activity: 'beef', amount: [0.3, 0.6] },
    { category: 'diet', activity: 'pork', amount: [0.3, 0.5] },
    { category: 'diet', activity: 'rice', amount: [0.5, 0.8] },
  ],
  'takeout-king': [
    { category: 'transport', activity: 'taxi', amount: [8, 15] },
    { category: 'energy', activity: 'electricity', amount: [7, 11] },
    { category: 'diet', activity: 'pork', amount: [0.3, 0.5] },
    { category: 'diet', activity: 'poultry', amount: [0.2, 0.4] },
    { category: 'diet', activity: 'rice', amount: [0.6, 0.9] },
    { category: 'consumption', activity: 'package', amount: [3, 6] },
    { category: 'consumption', activity: 'plastic', amount: [0.2, 0.5] },
  ],
  'car-owner': [
    { category: 'transport', activity: 'carGasoline', amount: [45, 60] },
    { category: 'energy', activity: 'electricity', amount: [8, 12] },
    { category: 'diet', activity: 'pork', amount: [0.2, 0.4] },
    { category: 'diet', activity: 'rice', amount: [0.5, 0.7] },
    { category: 'diet', activity: 'vegetables', amount: [0.3, 0.6] },
  ],
  newbie: [
    { category: 'transport', activity: 'bus', amount: [10, 18] },
    { category: 'transport', activity: 'carGasoline', amount: [0, 12] },
    { category: 'energy', activity: 'electricity', amount: [5, 8] },
    { category: 'diet', activity: 'pork', amount: [0.2, 0.4] },
    { category: 'diet', activity: 'rice', amount: [0.4, 0.7] },
    { category: 'diet', activity: 'vegetables', amount: [0.3, 0.5] },
    { category: 'consumption', activity: 'clothing', amount: [0, 1] },
  ],
}

/**
 * 确定性伪随机数生成器 (mulberry32)
 * 同样的种子永远产生同样的序列, 保证数据可复现
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
 * 为某个画像生成 30 天记录
 * @param {Object} persona
 * @param {number} days
 * @returns {Array} 记录数组
 */
export function generatePersonaRecords(persona, days = 30) {
  const template = ACTIVITY_TEMPLATES[persona.id] || []
  const records = []
  const today = new Date()

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const dateKey = toDateKey(date)

    // 每天一个独立种子, 保证可复现
    const rng = mulberry32(hashString(persona.id + dateKey))

    // 周末活动量更大
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const weekendFactor = isWeekend ? 1.25 : 1.0

    // 整体波动 ±20%
    const dayFactor = (0.8 + rng() * 0.4) * weekendFactor

    for (const t of template) {
      const [min, max] = t.amount
      const base = min + rng() * (max - min)
      const amount = Math.round(base * dayFactor * 100) / 100
      if (amount <= 0) continue
      records.push({
        date: dateKey,
        category: t.category,
        activity: t.activity,
        amount,
        gridRegion: 'national',
        createdAt: date.getTime() + records.length,
        personaId: persona.id,
      })
    }
  }

  return records
}

/**
 * 生成所有画像的记录
 */
export function generateAllPersonaRecords(days = 30) {
  const all = []
  for (const p of PERSONAS) {
    all.push(...generatePersonaRecords(p, days))
  }
  return all
}