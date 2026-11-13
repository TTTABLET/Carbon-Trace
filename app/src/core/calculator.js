/**
 * 碳足迹计算引擎
 *
 * 核心公式: E = Σ (A_i × F_i)
 *   A_i = 第 i 项活动的量
 *   F_i = 对应排放因子 (kgCO2e / 单位)
 */

import {
  CATEGORIES,
  BENCHMARKS,
  EQUIVALENTS,
  getFactorValue,
} from './emissionFactors.js'

/**
 * 计算单条记录的排放量
 * @param {Object} record { category, activity, amount, gridRegion? }
 * @returns {number} kgCO2e
 */
export function calcRecord(record) {
  const { category, activity, amount, gridRegion } = record
  const factor = getFactorValue(category, activity, gridRegion)
  const qty = Number(amount) || 0
  return round(factor * qty, 4)
}

/**
 * 计算一组记录的总排放量
 * @param {Array} records
 * @returns {number} kgCO2e
 */
export function calcTotal(records) {
  return round(
    records.reduce((sum, r) => sum + calcRecord(r), 0),
    4,
  )
}

/**
 * 按类别汇总
 * @param {Array} records
 * @returns {Object} { transport: 12.3, energy: 4.5, ... }
 */
export function calcByCategory(records) {
  const result = {}
  for (const key of Object.keys(CATEGORIES)) result[key] = 0
  for (const r of records) {
    if (!(r.category in result)) result[r.category] = 0
    result[r.category] = round(result[r.category] + calcRecord(r), 4)
  }
  return result
}

/**
 * 按日期汇总 (用于趋势图)
 * @param {Array} records
 * @returns {Array} [{ date: '2026-10-14', total: 12.3 }, ...] 按日期升序
 */
export function calcByDate(records) {
  const map = new Map()
  for (const r of records) {
    const d = r.date
    if (!map.has(d)) map.set(d, 0)
    map.set(d, round(map.get(d) + calcRecord(r), 4))
  }
  return [...map.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 生成最近 N 天的连续日期序列 (缺失日期补 0)
 * @param {Array} records
 * @param {number} days
 * @param {string} endDate 'YYYY-MM-DD', 默认今天
 */
export function calcDailySeries(records, days = 30, endDate = null) {
  const byDate = new Map(calcByDate(records).map((d) => [d.date, d.total]))
  const end = endDate ? new Date(endDate) : new Date()
  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const key = toDateKey(d)
    series.push({ date: key, total: byDate.get(key) ?? 0 })
  }
  return series
}

/**
 * 与基准值对比
 * @param {number} dailyAvg 日均排放 kgCO2e
 */
export function compareWithBenchmarks(dailyAvg) {
  return {
    china: ratio(dailyAvg, BENCHMARKS.chinaDaily),
    world: ratio(dailyAvg, BENCHMARKS.worldDaily),
    target: ratio(dailyAvg, BENCHMARKS.targetDaily),
  }
}

/**
 * 等效换算 (把 kgCO2e 翻译成大众能感知的东西)
 * @param {number} kg
 */
export function toEquivalents(kg) {
  return {
    trees: round(kg / EQUIVALENTS.treePerYear, 2), // 需要多少棵树吸收一年
    kmDriving: round(kg / EQUIVALENTS.kmDriving, 1), // 相当于开车多少公里
    phoneCharges: Math.round(kg / EQUIVALENTS.phoneCharge), // 相当于手机充电多少次
    ledHours: Math.round(kg / EQUIVALENTS.ledBulbHour), // 相当于 LED 灯亮多少小时
  }
}

/**
 * 评级 (基于日均排放)
 * @param {number} dailyAvg
 * @returns {Object} { level: 'A'|'B'|'C'|'D'|'E', score: 0-100 }
 */
export function getRating(dailyAvg) {
  const target = BENCHMARKS.targetDaily // 6.3
  const china = BENCHMARKS.chinaDaily // 21.9
  // 分数: 达到全球目标 = 100, 达到中国平均 = 50, 超过中国平均 2 倍 = 0
  let score
  if (dailyAvg <= target) {
    score = 100
  } else if (dailyAvg <= china) {
    score = 100 - ((dailyAvg - target) / (china - target)) * 50
  } else {
    score = Math.max(0, 50 - ((dailyAvg - china) / china) * 50)
  }
  score = Math.round(score)
  const level = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E'
  return { level, score }
}

/**
 * 计算连续打卡天数
 * @param {Array} records
 * @param {string} today 'YYYY-MM-DD'
 */
export function calcStreak(records, today = null) {
  const dates = new Set(records.map((r) => r.date))
  const cursor = today ? new Date(today) : new Date()
  let streak = 0
  // 如果今天没记录, 从昨天开始算
  if (!dates.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (dates.has(toDateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ---------- 工具函数 ----------

export function round(n, digits = 2) {
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}

export function toDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ratio(value, base) {
  if (!base) return 0
  return round(value / base, 2)
}
