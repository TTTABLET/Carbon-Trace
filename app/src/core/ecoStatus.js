/**
 * 实时生态状况模块 (离线模拟)
 *
 * 设计: 无网络依赖, 用确定性伪随机算法基于"日期+城市"生成数据
 * 特性: 同一天内数据稳定, 跨天自然变化, 看起来像真实监测
 *
 * 注意: 数据为模拟值, 仅用于演示, 不可作为实际环境参考
 */

import { toDateKey } from './calculator.js'

/**
 * 城市列表 (含经纬度, 用于计算日出日落)
 */
export const CITIES = [
  { id: 'beijing', name: { zh: '北京', en: 'Beijing' }, lat: 39.9, lon: 116.4, baseAqi: 78 },
  { id: 'shanghai', name: { zh: '上海', en: 'Shanghai' }, lat: 31.2, lon: 121.5, baseAqi: 62 },
  { id: 'guangzhou', name: { zh: '广州', en: 'Guangzhou' }, lat: 23.1, lon: 113.3, baseAqi: 55 },
  { id: 'chengdu', name: { zh: '成都', en: 'Chengdu' }, lat: 30.6, lon: 104.1, baseAqi: 71 },
  { id: 'xian', name: { zh: '西安', en: 'Xian' }, lat: 34.3, lon: 108.9, baseAqi: 83 },
  { id: 'harbin', name: { zh: '哈尔滨', en: 'Harbin' }, lat: 45.8, lon: 126.5, baseAqi: 68 },
  { id: 'kunming', name: { zh: '昆明', en: 'Kunming' }, lat: 25.0, lon: 102.7, baseAqi: 42 },
  { id: 'shenzhen', name: { zh: '深圳', en: 'Shenzhen' }, lat: 22.5, lon: 114.1, baseAqi: 48 },
]

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
 * AQI 等级划分 (中国标准 HJ 633-2012)
 */
export function aqiLevel(aqi) {
  if (aqi <= 50) return { key: 'excellent', color: '#00e400', zh: '优', en: 'Excellent' }
  if (aqi <= 100) return { key: 'good', color: '#e8d900', zh: '良', en: 'Good' }
  if (aqi <= 150) return { key: 'light', color: '#ff7e00', zh: '轻度污染', en: 'Lightly Polluted' }
  if (aqi <= 200) return { key: 'moderate', color: '#ff0000', zh: '中度污染', en: 'Moderately Polluted' }
  if (aqi <= 300) return { key: 'heavy', color: '#8f3f97', zh: '重度污染', en: 'Heavily Polluted' }
  return { key: 'severe', color: '#7e0023', zh: '严重污染', en: 'Severely Polluted' }
}

/**
 * 计算日出日落 (简化算法, 精度约 ±5 分钟)
 */
function sunTimes(lat, lon, date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
  const decl = 23.45 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365)
  const latRad = (lat * Math.PI) / 180
  const declRad = (decl * Math.PI) / 180
  const cosH = -Math.tan(latRad) * Math.tan(declRad)
  const H = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI
  const solarNoon = 12 - lon / 15 + 8
  const sunrise = solarNoon - H / 15
  const sunset = solarNoon + H / 15
  const fmt = (h) => {
    const hh = Math.floor(((h % 24) + 24) % 24)
    const mm = Math.round((h - Math.floor(h)) * 60)
    return String(hh).padStart(2, "0") + ":" + String(mm % 60).padStart(2, "0")
  }
  return { sunrise: fmt(sunrise), sunset: fmt(sunset) }
}

/**
 * 生成某城市某日的生态状况
 */
export function getEcoStatus(cityId, dateKey = null) {
  const city = CITIES.find((c) => c.id === cityId) || CITIES[0]
  const key = dateKey || toDateKey(new Date())
  const rng = mulberry32(hashString(city.id + key))
  const date = new Date(key)

  const month = date.getMonth() + 1
  const isWinter = month <= 2 || month >= 11
  const seasonFactor = isWinter ? 1.35 : month >= 6 && month <= 8 ? 0.75 : 1.0

  const aqi = Math.round(city.baseAqi * seasonFactor * (0.7 + rng() * 0.7))
  const level = aqiLevel(aqi)

  const pm25 = Math.round(aqi * 0.72 * (0.9 + rng() * 0.2))
  const pm10 = Math.round(pm25 * (1.4 + rng() * 0.5))
  const o3 = Math.round(40 + rng() * 80)
  const no2 = Math.round(15 + rng() * 45)
  const so2 = Math.round(5 + rng() * 20)
  const co = Math.round((0.4 + rng() * 1.2) * 10) / 10

  const latFactor = (45 - city.lat) * 0.55
  const seasonTemp = isWinter ? -8 : month >= 6 && month <= 8 ? 26 : 15
  const temperature = Math.round((seasonTemp + latFactor * 0.35 + (rng() - 0.5) * 8) * 10) / 10
  const humidity = Math.round(35 + rng() * 50)
  const windSpeed = Math.round((0.5 + rng() * 4.5) * 10) / 10
  const windDirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const windDir = windDirs[Math.floor(rng() * 8)]
  const uvIndex = Math.max(0, Math.round((isWinter ? 3 : 8) * (0.5 + rng() * 0.8)))
  const pressure = Math.round(1005 + rng() * 25)
  const visibility = Math.round((3 + rng() * 17) * 10) / 10

  const sun = sunTimes(city.lat, city.lon, date)

  return {
    cityId: city.id,
    cityName: city.name,
    date: key,
    aqi,
    level,
    pollutants: { pm25, pm10, o3, no2, so2, co },
    weather: { temperature, humidity, windSpeed, windDir, uvIndex, pressure, visibility },
    sun,
    advice: getAdvice(aqi, uvIndex, temperature),
  }
}

function getAdvice(aqi, uv, temp) {
  const tips = []
  if (aqi <= 50) {
    tips.push({ zh: '空气清新，适合户外活动', en: 'Air is clean - great for outdoor activities' })
  } else if (aqi <= 100) {
    tips.push({ zh: '空气质量可接受，敏感人群注意', en: 'Acceptable air; sensitive groups take care' })
  } else if (aqi <= 150) {
    tips.push({ zh: '建议减少户外剧烈运动', en: 'Reduce strenuous outdoor exercise' })
  } else {
    tips.push({ zh: '建议佩戴口罩，减少外出', en: 'Wear a mask and stay indoors' })
  }
  if (uv >= 7) tips.push({ zh: '紫外线强，注意防晒', en: 'High UV - use sun protection' })
  if (temp >= 32) tips.push({ zh: '高温天气，注意补水', en: 'Hot day - stay hydrated' })
  if (temp <= 0) tips.push({ zh: '低温天气，注意保暖', en: 'Cold - dress warmly' })
  return tips
}

/**
 * 生成 24 小时 AQI 变化曲线
 */
export function getHourlyAqi(cityId, dateKey = null) {
  const city = CITIES.find((c) => c.id === cityId) || CITIES[0]
  const key = dateKey || toDateKey(new Date())
  const base = getEcoStatus(cityId, key).aqi
  const rng = mulberry32(hashString(city.id + key + 'hourly'))
  const series = []
  for (let h = 0; h < 24; h++) {
    const hourFactor = 1 + 0.18 * Math.sin(((h - 7) / 24) * 2 * Math.PI) + 0.1 * Math.sin(((h - 18) / 24) * 2 * Math.PI)
    const value = Math.max(10, Math.round(base * hourFactor * (0.92 + rng() * 0.16)))
    series.push({ hour: h, aqi: value })
  }
  return series
}

/**
 * 生成 7 天 AQI 趋势
 */
export function getWeeklyAqi(cityId, endDate = null) {
  const end = endDate ? new Date(endDate) : new Date()
  const series = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const key = toDateKey(d)
    const s = getEcoStatus(cityId, key)
    series.push({ date: key, aqi: s.aqi, level: s.level })
  }
  return series
}
