/**
 * 排放因子数据表 (Emission Factors)
 * 单位统一为 kgCO2e / 单位量
 *
 * 数据来源:
 * - 中国: 生态环境部《省级温室气体清单编制指南》、国家发改委相关文件
 * - 电力: 中国区域电网平均排放因子 (2022 年数据)
 * - 国际: IPCC AR6, UK DEFRA 2023, US EPA
 *
 * 注意: 排放因子会随电网结构、技术进步而变化, 建议每年更新一次
 */

// 中国区域电网平均排放因子 (kgCO2e / kWh)
export const GRID_FACTORS = {
  national: { value: 0.5703, label: { zh: '全国平均', en: 'National Average' } },
  north: { value: 0.6782, label: { zh: '华北区域', en: 'North China' } },
  northeast: { value: 0.6231, label: { zh: '东北区域', en: 'Northeast China' } },
  east: { value: 0.5617, label: { zh: '华东区域', en: 'East China' } },
  central: { value: 0.5257, label: { zh: '华中区域', en: 'Central China' } },
  northwest: { value: 0.6104, label: { zh: '西北区域', en: 'Northwest China' } },
  south: { value: 0.4512, label: { zh: '南方区域', en: 'South China' } },
  southwest: { value: 0.2418, label: { zh: '西南区域', en: 'Southwest China' } },
}

/**
 * 交通类排放因子 (kgCO2e / km)
 * 燃油车按百公里油耗折算, 电动车按百公里电耗 × 电网因子折算
 */
export const TRANSPORT_FACTORS = {
  walk: { value: 0, unit: 'km', label: { zh: '步行', en: 'Walking' }, icon: '🚶' },
  bike: { value: 0, unit: 'km', label: { zh: '自行车', en: 'Bicycle' }, icon: '🚲' },
  ebike: { value: 0.0089, unit: 'km', label: { zh: '电动自行车', en: 'E-bike' }, icon: '🛵' },
  bus: { value: 0.0822, unit: 'km', label: { zh: '公交车', en: 'Bus' }, icon: '🚌' },
  subway: { value: 0.0417, unit: 'km', label: { zh: '地铁', en: 'Subway' }, icon: '🚇' },
  train: { value: 0.0365, unit: 'km', label: { zh: '火车/高铁', en: 'Train' }, icon: '🚄' },
  carGasoline: { value: 0.1921, unit: 'km', label: { zh: '燃油车', en: 'Gasoline Car' }, icon: '🚗' },
  carEV: { value: 0.0855, unit: 'km', label: { zh: '纯电动车', en: 'Electric Car' }, icon: '🔌' },
  taxi: { value: 0.2103, unit: 'km', label: { zh: '出租车/网约车', en: 'Taxi' }, icon: '🚕' },
  motorcycle: { value: 0.1032, unit: 'km', label: { zh: '摩托车', en: 'Motorcycle' }, icon: '🏍️' },
  flight: { value: 0.255, unit: 'km', label: { zh: '飞机', en: 'Flight' }, icon: '✈️' },
}

/**
 * 能源类排放因子
 */
export const ENERGY_FACTORS = {
  electricity: {
    value: null, // 动态取 GRID_FACTORS
    unit: 'kWh',
    label: { zh: '用电', en: 'Electricity' },
    icon: '⚡',
    dynamic: 'grid',
  },
  naturalGas: { value: 2.1622, unit: 'm³', label: { zh: '天然气', en: 'Natural Gas' }, icon: '🔥' },
  lpg: { value: 3.1013, unit: 'kg', label: { zh: '液化石油气', en: 'LPG' }, icon: '🛢️' },
  coal: { value: 2.66, unit: 'kg', label: { zh: '煤炭', en: 'Coal' }, icon: '⛏️' },
  heating: { value: 0.11, unit: 'm²·月', label: { zh: '集中供暖', en: 'District Heating' }, icon: '🌡️' },
  water: { value: 0.344, unit: 'm³', label: { zh: '自来水', en: 'Tap Water' }, icon: '💧' },
}

/**
 * 饮食类排放因子 (kgCO2e / kg 食物)
 * 来源: IPCC AR6, Poore & Nemecek (2018) Science
 */
export const DIET_FACTORS = {
  beef: { value: 60.0, unit: 'kg', label: { zh: '牛肉', en: 'Beef' }, icon: '🥩' },
  lamb: { value: 24.5, unit: 'kg', label: { zh: '羊肉', en: 'Lamb' }, icon: '🍖' },
  pork: { value: 7.2, unit: 'kg', label: { zh: '猪肉', en: 'Pork' }, icon: '🥓' },
  poultry: { value: 6.1, unit: 'kg', label: { zh: '禽肉', en: 'Poultry' }, icon: '🍗' },
  fish: { value: 5.1, unit: 'kg', label: { zh: '鱼类', en: 'Fish' }, icon: '🐟' },
  eggs: { value: 4.5, unit: 'kg', label: { zh: '蛋类', en: 'Eggs' }, icon: '🥚' },
  milk: { value: 3.2, unit: 'kg', label: { zh: '奶制品', en: 'Dairy' }, icon: '🥛' },
  rice: { value: 4.0, unit: 'kg', label: { zh: '米饭', en: 'Rice' }, icon: '🍚' },
  vegetables: { value: 0.5, unit: 'kg', label: { zh: '蔬菜', en: 'Vegetables' }, icon: '🥬' },
  fruits: { value: 0.7, unit: 'kg', label: { zh: '水果', en: 'Fruits' }, icon: '🍎' },
  grains: { value: 1.4, unit: 'kg', label: { zh: '谷物/面食', en: 'Grains' }, icon: '🍞' },
}

/**
 * 消费类排放因子 (kgCO2e / 件 或 / kg)
 */
export const CONSUMPTION_FACTORS = {
  clothing: { value: 12.0, unit: '件', label: { zh: '衣物', en: 'Clothing' }, icon: '👕' },
  electronics: { value: 85.0, unit: '件', label: { zh: '电子产品', en: 'Electronics' }, icon: '📱' },
  package: { value: 0.8, unit: '件', label: { zh: '快递包裹', en: 'Package' }, icon: '📦' },
  plastic: { value: 6.0, unit: 'kg', label: { zh: '塑料制品', en: 'Plastic' }, icon: '🧴' },
  paper: { value: 1.1, unit: 'kg', label: { zh: '纸张', en: 'Paper' }, icon: '📄' },
}

/**
 * 类别元数据
 */
export const CATEGORIES = {
  transport: {
    label: { zh: '交通出行', en: 'Transport' },
    icon: '🚗',
    color: '#4A90D9',
    factors: TRANSPORT_FACTORS,
  },
  energy: {
    label: { zh: '能源消耗', en: 'Energy' },
    icon: '⚡',
    color: '#F5A623',
    factors: ENERGY_FACTORS,
  },
  diet: {
    label: { zh: '饮食', en: 'Diet' },
    icon: '🍽️',
    color: '#7ED321',
    factors: DIET_FACTORS,
  },
  consumption: {
    label: { zh: '日常消费', en: 'Consumption' },
    icon: '🛍️',
    color: '#BD10E0',
    factors: CONSUMPTION_FACTORS,
  },
}

/**
 * 参考基准值 (kgCO2e / 人 / 年)
 * 来源: 全球碳计划 (Global Carbon Project) 2023, 世界银行
 */
export const BENCHMARKS = {
  chinaPerCapita: 8000,
  worldPerCapita: 4700,
  globalTarget: 2300,
  chinaDaily: 8000 / 365,
  worldDaily: 4700 / 365,
  targetDaily: 2300 / 365,
}

/**
 * 等效换算系数
 */
export const EQUIVALENTS = {
  treePerYear: 18.3, // 一棵树每年吸收约 18.3 kgCO2
  kmDriving: 0.1921, // 每公里燃油车排放
  phoneCharge: 0.0119, // 一次手机充电
  ledBulbHour: 0.0085, // 一个 LED 灯泡每小时
}

/**
 * 获取某类别下所有活动项
 */
export function getActivities(categoryKey) {
  const cat = CATEGORIES[categoryKey]
  if (!cat) return []
  return Object.entries(cat.factors).map(([key, f]) => ({
    key,
    category: categoryKey,
    ...f,
  }))
}

/**
 * 获取单个活动的排放因子值
 * @param {string} categoryKey 类别
 * @param {string} activityKey 活动
 * @param {string} gridRegion 电网区域 (仅 electricity 需要)
 */
export function getFactorValue(categoryKey, activityKey, gridRegion = 'national') {
  const cat = CATEGORIES[categoryKey]
  if (!cat) return 0
  const factor = cat.factors[activityKey]
  if (!factor) return 0
  if (factor.dynamic === 'grid') {
    return GRID_FACTORS[gridRegion]?.value ?? GRID_FACTORS.national.value
  }
  return factor.value ?? 0
}
