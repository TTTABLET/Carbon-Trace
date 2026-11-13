/**
 * 本地数据存储 (IndexedDB via Dexie)
 * 所有数据仅保存在浏览器本地, 不上传服务器
 */

import Dexie from 'dexie'

export const db = new Dexie('carbon-trace')

db.version(1).stores({
  // id 自增, date 建索引用于按日查询
  records: '++id, date, category, activity, createdAt',
  // 键值对, 存设置
  settings: 'key',
})

/**
 * 添加一条记录
 * @param {Object} record { date, category, activity, amount, gridRegion }
 */
export async function addRecord(record) {
  const now = Date.now()
  return db.records.add({
    date: record.date,
    category: record.category,
    activity: record.activity,
    amount: Number(record.amount),
    gridRegion: record.gridRegion || 'national',
    createdAt: now,
  })
}

/**
 * 删除一条记录
 */
export async function deleteRecord(id) {
  return db.records.delete(id)
}

/**
 * 获取全部记录 (按日期倒序)
 */
export async function getAllRecords() {
  const list = await db.records.toArray()
  return list.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt - a.createdAt
  })
}

/**
 * 按日期范围获取记录
 * @param {string} start 'YYYY-MM-DD'
 * @param {string} end 'YYYY-MM-DD'
 */
export async function getRecordsBetween(start, end) {
  return db.records.where('date').between(start, end, true, true).toArray()
}

/**
 * 清空所有记录
 */
export async function clearAllRecords() {
  return db.records.clear()
}

/**
 * 读取设置
 */
export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

/**
 * 写入设置
 */
export async function setSetting(key, value) {
  return db.settings.put({ key, value })
}

/**
 * 导出全部数据为 JSON 字符串
 */
export async function exportData() {
  const records = await db.records.toArray()
  const settings = await db.settings.toArray()
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), records, settings },
    null,
    2,
  )
}

/**
 * 从 JSON 字符串导入数据 (合并, 不覆盖已有)
 */
export async function importData(json) {
  const data = JSON.parse(json)
  if (!data || !Array.isArray(data.records)) {
    throw new Error('Invalid data format')
  }
  const cleaned = data.records.map((r) => ({
    date: r.date,
    category: r.category,
    activity: r.activity,
    amount: Number(r.amount),
    gridRegion: r.gridRegion || 'national',
    createdAt: r.createdAt || Date.now(),
  }))
  await db.records.bulkAdd(cleaned)
  return cleaned.length
}
/**
 * 批量写入记录 (用于预置示例数据)
 */
export async function bulkAddRecords(records) {
  return db.records.bulkAdd(records)
}

/**
 * 检查是否已初始化过示例数据
 */
export async function isSeeded() {
  return (await getSetting('seeded', false)) === true
}

/**
 * 标记已初始化
 */
export async function markSeeded() {
  return setSetting('seeded', true)
}

/**
 * 读取用户画像
 */
export async function getProfile() {
  return getSetting('profile', { name: null, avatar: '🙋' })
}

/**
 * 保存用户画像
 */
export async function saveProfile(profile) {
  return setSetting('profile', profile)
}

/**
 * 成长状态的默认值 (多树模型)
 */
export function defaultGrowth() {
  return {
    xp: 0,
    energy: 0,
    trees: [],
    totalSaved: 0,
    treesCompleted: 0,
    lastRewardDate: null,
    lastYieldDate: null,
    waterLog: [],
  }
}

/**
 * 读取成长状态
 *
 * 兼容旧版单树结构 (stage/progress), 自动迁移成 trees 数组。
 */
export async function getGrowth() {
  const raw = await getSetting('growth', null)
  if (!raw) return defaultGrowth()

  const base = { ...defaultGrowth(), ...raw }

  if (!Array.isArray(base.trees)) {
    // 旧版: 单棵树 + stage/progress
    const trees = []
    const completed = base.treesCompleted || 0
    for (let i = 0; i < completed; i++) {
      trees.push({ id: `tree-${i + 1}`, speciesId: 'common', stage: 5, progress: 0, name: null })
    }
    if ((base.stage || 0) > 0 || (base.progress || 0) > 0) {
      trees.push({
        id: `tree-${trees.length + 1}`,
        speciesId: 'common',
        stage: base.stage || 0,
        progress: base.progress || 0,
        name: null,
      })
    }
    base.trees = trees
  }

  delete base.stage
  delete base.progress
  return base
}

/**
 * 保存成长状态
 */
export async function saveGrowth(growth) {
  return setSetting('growth', growth)
}