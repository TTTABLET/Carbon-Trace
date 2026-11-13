/**
 * 全国城市空气质量指数 (AQI) 数据
 *
 * 数据来源: 生态环境部数据中心 (datacenter.mep.gov.cn)
 * 采集方式: 原项目 Node 爬虫抓取全国城市实时 AQI 快照
 * 说明: 这是某一时点的静态快照, 用于离线演示, 不代表当前实时状况
 *
 * 共 173 个城市, AQI 值域 20 ~ 189
 */

export const AQI_CITIES = [
  { name: '江阴', value: 189, coord: [120.26, 31.91] },
  { name: '盐城', value: 186, coord: [120.13, 33.38] },
  { name: '泰州', value: 183, coord: [119.9, 32.49] },
  { name: '扬州', value: 172, coord: [119.42, 32.39] },
  { name: '临沂', value: 168, coord: [118.35, 35.05] },
  { name: '枣庄', value: 165, coord: [117.57, 34.86] },
  { name: '杭州', value: 162, coord: [120.19, 30.26] },
  { name: '镇江', value: 158, coord: [119.44, 32.2] },
  { name: '常州', value: 156, coord: [119.95, 31.79] },
  { name: '张家港', value: 149, coord: [120.555821, 31.875428] },
  { name: '日照', value: 148, coord: [119.46, 35.42] },
  { name: '苏州', value: 147, coord: [120.62, 31.32] },
  { name: '金华', value: 145, coord: [119.64, 29.12] },
  { name: '南通', value: 145, coord: [121.05, 32.08] },
  { name: '富阳', value: 144, coord: [119.95, 30.07] },
  { name: '绍兴', value: 140, coord: [120.58, 30.01] },
  { name: '济宁', value: 139, coord: [116.59, 35.38] },
  { name: '呼和浩特', value: 137, coord: [111.65, 40.82] },
  { name: '湖州', value: 135, coord: [120.1, 30.86] },
  { name: '吴江', value: 135, coord: [120.63, 31.16] },
  { name: '无锡', value: 134, coord: [120.29, 31.59] },
  { name: '常熟', value: 134, coord: [120.74, 31.64] },
  { name: '莱芜', value: 134, coord: [117.67, 36.19] },
  { name: '马鞍山', value: 132, coord: [118.48, 31.56] },
  { name: '胶南', value: 129, coord: [119.97, 35.88] },
  { name: '连云港', value: 127, coord: [119.16, 34.59] },
  { name: '宜兴', value: 127, coord: [119.82, 31.36] },
  { name: '金坛', value: 127, coord: [119.56, 31.74] },
  { name: '句容', value: 125, coord: [119.16, 31.95] },
  { name: '徐州', value: 125, coord: [117.2, 34.26] },
  { name: '即墨', value: 124, coord: [120.45, 36.38] },
  { name: '溧阳', value: 123, coord: [119.48, 31.43] },
  { name: '宿迁', value: 122, coord: [118.3, 33.96] },
  { name: '嘉兴', value: 122, coord: [120.76, 30.77] },
  { name: '芜湖', value: 122, coord: [118.38, 31.33] },
  { name: '聊城', value: 122, coord: [115.97, 36.45] },
  { name: '义乌', value: 119, coord: [120.06, 29.32] },
  { name: '太仓', value: 119, coord: [121.1, 31.45] },
  { name: '合肥', value: 117, coord: [117.27, 31.86] },
  { name: '青岛', value: 115, coord: [120.33, 36.07] },
  { name: '潍坊', value: 115, coord: [119.1, 36.62] },
  { name: '丽水', value: 114, coord: [119.92, 28.45] },
  { name: '南京', value: 113, coord: [118.78, 32.04] },
  { name: '海门', value: 110, coord: [121.15, 31.89] },
  { name: '泰安', value: 110, coord: [117.13, 36.18] },
  { name: '胶州', value: 109, coord: [120.03336, 36.264622] },
  { name: '寿光', value: 109, coord: [118.73, 36.86] },
  { name: '上海', value: 108, coord: [121.48, 31.22] },
  { name: '抚顺', value: 107, coord: [123.97, 41.97] },
  { name: '淮安', value: 107, coord: [119.15, 33.5] },
  { name: '菏泽', value: 107, coord: [115.480656, 35.23375] },
  { name: '宁波', value: 105, coord: [121.56, 29.86] },
  { name: '临安', value: 104, coord: [119.72, 30.23] },
  { name: '昆山', value: 104, coord: [120.95, 31.39] },
  { name: '临汾', value: 102, coord: [111.5, 36.08] },
  { name: '温州', value: 102, coord: [120.65, 28.01] },
  { name: '滨州', value: 98, coord: [118.03, 37.36] },
  { name: '丹东', value: 97, coord: [124.37, 40.13] },
  { name: '衢州', value: 97, coord: [118.88, 28.97] },
  { name: '自贡', value: 95, coord: [104.778442, 29.33903] },
  { name: '淄博', value: 94, coord: [118.05, 36.78] },
  { name: '莱西', value: 93, coord: [120.53, 36.86] },
  { name: '德州', value: 93, coord: [116.29, 37.45] },
  { name: '舟山', value: 92, coord: [122.207216, 29.985295] },
  { name: '台州', value: 92, coord: [121.420757, 28.656386] },
  { name: '东营', value: 92, coord: [118.49, 37.46] },
  { name: '武汉', value: 92, coord: [114.31, 30.52] },
  { name: '绵阳', value: 92, coord: [104.73, 31.48] },
  { name: '济南', value: 90, coord: [117, 36.65] },
  { name: '郑州', value: 90, coord: [113.65, 34.76] },
  { name: '平顶山', value: 89, coord: [113.29, 33.75] },
  { name: '沧州', value: 87, coord: [116.83, 38.33] },
  { name: '九江', value: 87, coord: [115.97, 29.71] },
  { name: '安阳', value: 87, coord: [114.35, 36.1] },
  { name: '焦作', value: 85, coord: [113.21, 35.24] },
  { name: '长治', value: 84, coord: [113.08, 36.18] },
  { name: '招远', value: 84, coord: [120.38, 37.35] },
  { name: '长沙', value: 84, coord: [113, 28.21] },
  { name: '天津', value: 83, coord: [117.2, 39.13] },
  { name: '邯郸', value: 83, coord: [114.47, 36.6] },
  { name: '本溪', value: 83, coord: [123.73, 41.3] },
  { name: '洛阳', value: 83, coord: [112.44, 34.7] },
  { name: '德阳', value: 83, coord: [104.37, 31.13] },
  { name: '烟台', value: 82, coord: [121.39, 37.52] },
  { name: '包头', value: 80, coord: [110, 40.58] },
  { name: '莱州', value: 79, coord: [119.942327, 37.177017] },
  { name: '开封', value: 79, coord: [114.35, 34.79] },
  { name: '株洲', value: 78, coord: [113.16, 27.83] },
  { name: '岳阳', value: 78, coord: [113.09, 29.37] },
  { name: '衡水', value: 77, coord: [115.72, 37.72] },
  { name: '瓦房店', value: 77, coord: [121.979603, 39.627114] },
  { name: '章丘', value: 77, coord: [117.53, 36.72] },
  { name: '平度', value: 77, coord: [119.97, 36.77] },
  { name: '三门峡', value: 75, coord: [111.19, 34.76] },
  { name: '荆州', value: 75, coord: [112.239741, 30.335165] },
  { name: '宜宾', value: 75, coord: [104.56, 29.77] },
  { name: '鞍山', value: 73, coord: [122.85, 41.12] },
  { name: '湘潭', value: 72, coord: [112.91, 27.87] },
  { name: '泸州', value: 72, coord: [105.39, 28.91] },
  { name: '保定', value: 70, coord: [115.48, 38.85] },
  { name: '太原', value: 70, coord: [112.53, 37.87] },
  { name: '宜昌', value: 70, coord: [111.3, 30.7] },
  { name: '大同', value: 69, coord: [113.3, 40.12] },
  { name: '哈尔滨', value: 69, coord: [126.63, 45.75] },
  { name: '唐山', value: 68, coord: [118.02, 39.63] },
  { name: '沈阳', value: 68, coord: [123.38, 41.8] },
  { name: '南昌', value: 68, coord: [115.89, 28.68] },
  { name: '文登', value: 68, coord: [122.05, 37.2] },
  { name: '乳山', value: 68, coord: [121.52, 36.89] },
  { name: '石家庄', value: 67, coord: [114.48, 38.03] },
  { name: '厦门', value: 64, coord: [118.1, 24.46] },
  { name: '邢台', value: 63, coord: [114.48, 37.05] },
  { name: '攀枝花', value: 63, coord: [101.718637, 26.582347] },
  { name: '廊坊', value: 62, coord: [116.7, 39.53] },
  { name: '重庆', value: 62, coord: [106.54, 29.59] },
  { name: '锦州', value: 60, coord: [121.15, 41.13] },
  { name: '秦皇岛', value: 58, coord: [119.57, 39.95] },
  { name: '阳泉', value: 58, coord: [113.57, 37.85] },
  { name: '蓬莱', value: 58, coord: [120.75, 37.8] },
  { name: '常德', value: 58, coord: [111.69, 29.05] },
  { name: '成都', value: 58, coord: [104.06, 30.67] },
  { name: '长春', value: 57, coord: [125.35, 43.88] },
  { name: '南充', value: 57, coord: [106.110698, 30.837793] },
  { name: '昆明', value: 57, coord: [102.73, 25.04] },
  { name: '玉溪', value: 57, coord: [102.52, 24.35] },
  { name: '威海', value: 55, coord: [122.1, 37.5] },
  { name: '张家界', value: 55, coord: [110.479191, 29.117096] },
  { name: '营口', value: 54, coord: [122.18, 40.65] },
  { name: '吉林', value: 54, coord: [126.57, 43.87] },
  { name: '桂林', value: 54, coord: [110.28, 25.29] },
  { name: '荣成', value: 53, coord: [122.41, 37.16] },
  { name: '泉州', value: 52, coord: [118.58, 24.93] },
  { name: '鄂尔多斯', value: 51, coord: [109.781327, 39.608266] },
  { name: '珠海', value: 50, coord: [113.52, 22.3] },
  { name: '贵阳', value: 50, coord: [106.71, 26.57] },
  { name: '张家口', value: 49, coord: [114.87, 40.82] },
  { name: '江门', value: 49, coord: [113.06, 22.61] },
  { name: '承德', value: 47, coord: [117.93, 40.97] },
  { name: '盘锦', value: 47, coord: [122.070714, 41.119997] },
  { name: '广州', value: 47, coord: [113.23, 23.16] },
  { name: '大连', value: 46, coord: [121.62, 38.92] },
  { name: '牡丹江', value: 45, coord: [129.58, 44.6] },
  { name: '北海', value: 45, coord: [109.12, 21.49] },
  { name: '葫芦岛', value: 44, coord: [120.836932, 40.711052] },
  { name: '北京', value: 43, coord: [116.46, 39.92] },
  { name: '中山', value: 43, coord: [113.38, 22.52] },
  { name: '三亚', value: 43, coord: [109.511909, 18.252847] },
  { name: '佛山', value: 42, coord: [113.11, 23.05] },
  { name: '赤峰', value: 41, coord: [118.87, 42.28] },
  { name: '南宁', value: 40, coord: [108.33, 22.84] },
  { name: '柳州', value: 40, coord: [109.4, 24.33] },
  { name: '曲靖', value: 40, coord: [103.79, 25.51] },
  { name: '齐齐哈尔', value: 39, coord: [123.97, 47.33] },
  { name: '福州', value: 39, coord: [119.3, 26.08] },
  { name: '深圳', value: 39, coord: [114.07, 22.62] },
  { name: '东莞', value: 38, coord: [113.75, 23.04] },
  { name: '遵义', value: 38, coord: [106.9, 27.7] },
  { name: '大庆', value: 36, coord: [125.03, 46.58] },
  { name: '韶关', value: 35, coord: [113.62, 24.84] },
  { name: '揭阳', value: 34, coord: [116.35, 23.55] },
  { name: '汕头', value: 33, coord: [116.69, 23.39] },
  { name: '肇庆', value: 30, coord: [112.44, 23.05] },
  { name: '汕尾', value: 30, coord: [115.375279, 22.786211] },
  { name: '河源', value: 30, coord: [114.68, 23.73] },
  { name: '湛江', value: 27, coord: [110.359377, 21.270708] },
  { name: '清远', value: 27, coord: [113.01, 23.7] },
  { name: '云浮', value: 27, coord: [112.02, 22.93] },
  { name: '茂名', value: 26, coord: [110.88, 21.68] },
  { name: '惠州', value: 25, coord: [114.4, 23.09] },
  { name: '阳江', value: 25, coord: [111.95, 21.85] },
  { name: '梅州', value: 23, coord: [116.1, 24.55] },
  { name: '海口', value: 23, coord: [110.35, 20.02] },
  { name: '潮州', value: 20, coord: [116.63, 23.68] },
]

/**
 * AQI 等级划分 (依据 HJ 633-2012 环境空气质量指数技术规定)
 */
export const AQI_LEVELS = [
  { max: 50, level: 1, key: 'excellent', color: '#00e400' },
  { max: 100, level: 2, key: 'good', color: '#ffff00' },
  { max: 150, level: 3, key: 'light', color: '#ff7e00' },
  { max: 200, level: 4, key: 'moderate', color: '#ff0000' },
  { max: 300, level: 5, key: 'heavy', color: '#8f3f97' },
  { max: Infinity, level: 6, key: 'severe', color: '#7e0023' },
]

/**
 * 根据 AQI 值取等级信息
 */
export function aqiLevel(value) {
  for (const l of AQI_LEVELS) {
    if (value <= l.max) return l
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1]
}

/**
 * 统计各等级城市数量
 */
export function aqiDistribution(cities = AQI_CITIES) {
  const buckets = AQI_LEVELS.map((l) => ({ ...l, count: 0 }))
  for (const c of cities) {
    const lv = aqiLevel(c.value)
    const b = buckets.find((b) => b.level === lv.level)
    if (b) b.count++
  }
  return buckets
}

/**
 * 全国 AQI 概览统计
 */
export function aqiSummary(cities = AQI_CITIES) {
  if (!cities.length) return { avg: 0, max: null, min: null, count: 0 }
  const values = cities.map((c) => c.value)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const max = cities.reduce((a, b) => (b.value > a.value ? b : a))
  const min = cities.reduce((a, b) => (b.value < a.value ? b : a))
  return { avg, max, min, count: cities.length }
}
