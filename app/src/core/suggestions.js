/**
 * 减排建议规则库
 *
 * 设计思路:
 * 1. 找出用户排放占比最高的类别
 * 2. 匹配该类别下的建议
 * 3. 每条建议带"预计减排量", 让用户看到具体收益
 *
 * 减排量估算基于典型场景, 实际效果因人而异
 */

import { calcByCategory, round } from './calculator.js'

/**
 * 建议库
 * impact: 预计年减排量 kgCO2e (典型场景估算)
 * difficulty: 1-3 (1=容易, 2=中等, 3=较难)
 */
export const SUGGESTIONS = {
  transport: [
    {
      id: 't1',
      impact: 480,
      difficulty: 1,
      title: { zh: '每周少开一天车', en: 'Drive one day less per week' },
      desc: {
        zh: '改乘公交或地铁通勤, 按每周 40 公里计算',
        en: 'Switch to bus or subway, based on 40 km per week',
      },
    },
    {
      id: 't2',
      impact: 320,
      difficulty: 1,
      title: { zh: '短途改骑车或步行', en: 'Walk or cycle for short trips' },
      desc: {
        zh: '3 公里内的出行用自行车代替汽车',
        en: 'Replace car trips under 3 km with a bicycle',
      },
    },
    {
      id: 't3',
      impact: 260,
      difficulty: 2,
      title: { zh: '考虑换电动车', en: 'Consider an electric vehicle' },
      desc: {
        zh: '纯电动车每公里排放约为燃油车的一半',
        en: 'EVs emit roughly half the CO2 per km of gasoline cars',
      },
    },
    {
      id: 't4',
      impact: 150,
      difficulty: 2,
      title: { zh: '减少不必要的飞行', en: 'Reduce unnecessary flights' },
      desc: {
        zh: '一次 1000 公里飞行约排放 255 kgCO2e, 可用视频会议替代',
        en: 'A 1000 km flight emits ~255 kgCO2e; use video calls instead',
      },
    },
    {
      id: 't5',
      impact: 90,
      difficulty: 1,
      title: { zh: '拼车出行', en: 'Carpool' },
      desc: {
        zh: '两人拼车, 人均排放直接减半',
        en: 'Carpooling with one other person halves per-person emissions',
      },
    },
  ],
  energy: [
    {
      id: 'e1',
      impact: 210,
      difficulty: 1,
      title: { zh: '空调调高 1℃', en: 'Raise AC by 1°C' },
      desc: {
        zh: '夏季空调每调高 1℃, 可省电约 7%',
        en: 'Each 1°C increase saves about 7% of cooling energy',
      },
    },
    {
      id: 'e2',
      impact: 180,
      difficulty: 1,
      title: { zh: '换用 LED 灯', en: 'Switch to LED bulbs' },
      desc: {
        zh: 'LED 比白炽灯省电 80%, 寿命长 10 倍',
        en: 'LEDs use 80% less power and last 10x longer',
      },
    },
    {
      id: 'e3',
      impact: 150,
      difficulty: 1,
      title: { zh: '拔掉待机电器', en: 'Unplug idle appliances' },
      desc: {
        zh: '待机功耗占家庭用电的 5%-10%',
        en: 'Standby power accounts for 5%-10% of home electricity',
      },
    },
    {
      id: 'e4',
      impact: 400,
      difficulty: 3,
      title: { zh: '安装屋顶光伏', en: 'Install rooftop solar' },
      desc: {
        zh: '3kW 光伏系统年发电约 3600 度, 可抵消大部分家庭用电',
        en: 'A 3kW solar system generates ~3600 kWh/year',
      },
    },
    {
      id: 'e5',
      impact: 120,
      difficulty: 2,
      title: { zh: '使用节能家电', en: 'Use energy-efficient appliances' },
      desc: {
        zh: '一级能效家电比三级能效省电约 30%',
        en: 'Top-rated appliances use ~30% less energy',
      },
    },
  ],
  diet: [
    {
      id: 'd1',
      impact: 600,
      difficulty: 2,
      title: { zh: '减少牛肉消费', en: 'Eat less beef' },
      desc: {
        zh: '牛肉排放因子高达 60 kgCO2e/kg, 是蔬菜的 120 倍',
        en: 'Beef emits 60 kgCO2e/kg — 120x that of vegetables',
      },
    },
    {
      id: 'd2',
      impact: 300,
      difficulty: 1,
      title: { zh: '每周一天素食', en: 'Go vegetarian one day a week' },
      desc: {
        zh: '一天素食约减排 0.8 kgCO2e, 一年累计可观',
        en: 'One vegetarian day saves ~0.8 kgCO2e, adding up over a year',
      },
    },
    {
      id: 'd3',
      impact: 200,
      difficulty: 1,
      title: { zh: '减少食物浪费', en: 'Reduce food waste' },
      desc: {
        zh: '全球约 1/3 食物被浪费, 其排放占总量 8%',
        en: 'About 1/3 of food is wasted, causing 8% of global emissions',
      },
    },
    {
      id: 'd4',
      impact: 150,
      difficulty: 1,
      title: { zh: '优先本地当季食材', en: 'Choose local, seasonal food' },
      desc: {
        zh: '减少长途运输和反季节种植的能耗',
        en: 'Cuts energy from long-distance transport and greenhouse growing',
      },
    },
  ],
  consumption: [
    {
      id: 'c1',
      impact: 250,
      difficulty: 1,
      title: { zh: '延长电子产品使用周期', en: 'Keep electronics longer' },
      desc: {
        zh: '手机多用 1 年, 可减少约 1/3 的制造排放',
        en: 'Using a phone one extra year cuts ~1/3 of its manufacturing emissions',
      },
    },
    {
      id: 'c2',
      impact: 180,
      difficulty: 1,
      title: { zh: '购买二手衣物', en: 'Buy second-hand clothes' },
      desc: {
        zh: '一件新衣约排放 12 kgCO2e, 二手可省下大部分',
        en: 'A new garment emits ~12 kgCO2e; second-hand saves most of it',
      },
    },
    {
      id: 'c3',
      impact: 120,
      difficulty: 1,
      title: { zh: '减少一次性塑料', en: 'Cut single-use plastic' },
      desc: {
        zh: '自带购物袋和水杯, 一年可减少数十公斤塑料',
        en: 'Bring your own bag and bottle to avoid tens of kg of plastic yearly',
      },
    },
    {
      id: 'c4',
      impact: 90,
      difficulty: 1,
      title: { zh: '合并快递订单', en: 'Combine online orders' },
      desc: {
        zh: '减少包装和配送次数, 每个包裹约 0.8 kgCO2e',
        en: 'Fewer packages means less packaging and delivery emissions',
      },
    },
  ],
}

/**
 * 根据用户记录生成个性化建议
 * @param {Array} records
 * @param {number} limit 返回条数
 * @returns {Array} 建议列表, 按优先级排序
 */
export function generateSuggestions(records, limit = 6) {
  const byCategory = calcByCategory(records)
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0)

  // 按类别占比排序
  const ranked = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  const result = []
  for (const [catKey, catValue] of ranked) {
    const list = SUGGESTIONS[catKey] || []
    const share = total > 0 ? catValue / total : 0
    for (const s of list) {
      result.push({
        ...s,
        category: catKey,
        // 优先级 = 类别占比 × 减排量 / 难度
        priority: round(share * s.impact / s.difficulty, 2),
      })
    }
  }

  // 如果记录太少, 补充通用建议
  if (result.length < limit) {
    for (const [catKey, list] of Object.entries(SUGGESTIONS)) {
      if (ranked.some(([k]) => k === catKey)) continue
      for (const s of list) {
        result.push({ ...s, category: catKey, priority: round(s.impact / s.difficulty / 100, 2) })
      }
    }
  }

  return result.sort((a, b) => b.priority - a.priority).slice(0, limit)
}

/**
 * 计算所有建议的总减排潜力
 */
export function totalPotential(suggestions) {
  return round(suggestions.reduce((sum, s) => sum + s.impact, 0), 0)
}
