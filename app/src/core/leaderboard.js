/**
 * 排行榜
 *
 * 把预置画像 + 当前用户放在一起, 按日均排放升序排名
 * 排放越低排名越靠前, 起到正向激励作用
 */

import { PERSONAS, generatePersonaRecords } from './seedData.js'
import { calcTotal, calcStreak, getRating, round } from './calculator.js'

/**
 * 计算某个画像的统计摘要
 */
export function summarizePersona(persona, days = 30) {
  const records = generatePersonaRecords(persona, days)
  const total = calcTotal(records)
  const activeDays = new Set(records.map((r) => r.date)).size || 1
  const dailyAvg = round(total / activeDays, 2)
  return {
    id: persona.id,
    name: persona.name,
    avatar: persona.avatar,
    tagline: persona.tagline,
    desc: persona.desc,
    color: persona.color,
    isMe: false,
    total,
    dailyAvg,
    activeDays,
    streak: calcStreak(records),
    rating: getRating(dailyAvg),
  }
}

/**
 * 生成完整排行榜
 * @param {Array} myRecords 当前用户的记录
 * @param {Object} myProfile { name, avatar }
 * @param {number} days
 */
export function buildLeaderboard(myRecords, myProfile = {}, days = 30, today = null) {
  const rows = PERSONAS.map((p) => summarizePersona(p, days))

  const myTotal = calcTotal(myRecords)
  const myActiveDays = new Set(myRecords.map((r) => r.date)).size
  const hasMyData = myActiveDays > 0
  const myDailyAvg = hasMyData ? round(myTotal / myActiveDays, 2) : 0

  if (hasMyData) {
    rows.push({
      id: 'me',
      name: myProfile.name || { zh: '我', en: 'Me' },
      avatar: myProfile.avatar || '🙋',
      tagline: { zh: '这是你', en: 'This is you' },
      desc: { zh: '', en: '' },
      color: '#2e9e5b',
      isMe: true,
      total: myTotal,
      dailyAvg: myDailyAvg,
      activeDays: myActiveDays,
      streak: calcStreak(myRecords, today),
      rating: getRating(myDailyAvg),
    })
  }

  rows.sort((a, b) => a.dailyAvg - b.dailyAvg)
  rows.forEach((r, i) => (r.rank = i + 1))

  const me = rows.find((r) => r.isMe) || null
  const total = rows.length

  return {
    rows,
    me,
    total,
    hasMyData,
    // 超过多少人 (百分比)
    betterThan: me && total > 1 ? Math.round(((total - me.rank) / (total - 1)) * 100) : 0,
    // 与第一名的差距
    gapToFirst: me ? round(me.dailyAvg - rows[0].dailyAvg, 2) : 0,
    // 与平均值的差距
    avgOfAll: round(rows.reduce((s, r) => s + r.dailyAvg, 0) / total, 2),
  }
}