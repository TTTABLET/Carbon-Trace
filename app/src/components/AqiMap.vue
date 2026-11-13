<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts/core'
import { MapChart, BarChart, EffectScatterChart, ScatterChart } from 'echarts/charts'
import {
  GeoComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { AQI_CITIES, AQI_LEVELS, aqiLevel, aqiDistribution, aqiSummary } from '../core/aqiCities.js'
import { CHINA_MAP_NAME, CHINA_GEO_JSON } from '../core/chinaMap.js'

echarts.use([
  MapChart,
  BarChart,
  EffectScatterChart,
  ScatterChart,
  GeoComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  TitleComponent,
  CanvasRenderer,
])

const { t, locale } = useI18n()

const mapEl = ref(null)
const barEl = ref(null)
let mapChart = null
let barChart = null

const selected = ref([])

const summary = computed(() => aqiSummary())
const distribution = computed(() => aqiDistribution())

const levelNames = {
  excellent: { zh: '优', en: 'Excellent' },
  good: { zh: '良', en: 'Good' },
  light: { zh: '轻度污染', en: 'Light' },
  moderate: { zh: '中度污染', en: 'Moderate' },
  heavy: { zh: '重度污染', en: 'Heavy' },
  severe: { zh: '严重污染', en: 'Severe' },
}

function levelLabel(key) {
  return levelNames[key] ? levelNames[key][locale.value] : key
}

function themeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  return {
    isDark,
    text: isDark ? '#a8b8ae' : '#5a6b60',
    area: isDark ? '#1c2620' : '#f4f8f5',
    border: isDark ? '#2e3a33' : '#dbe5de',
    tooltipBg: isDark ? '#232d27' : '#fff',
    tooltipBorder: isDark ? '#2e3a33' : '#e2e8e3',
    tooltipText: isDark ? '#e8f0ea' : '#1a2b1f',
  }
}

function renderMap() {
  if (!mapChart) return
  const c = themeColors()

  const scatterData = AQI_CITIES.map((city) => ({
    name: city.name,
    value: [...city.coord, city.value],
  }))

  mapChart.setOption(
    {
      tooltip: {
        trigger: 'item',
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        textStyle: { color: c.tooltipText, fontSize: 12 },
        formatter: (p) => {
          if (p.seriesType === 'effectScatter' || p.seriesType === 'scatter') {
            const v = p.value[2]
            const lv = aqiLevel(v)
            return `${p.name}<br/>AQI <b style="color:${lv.color}">${v}</b> · ${levelLabel(lv.key)}`
          }
          return p.name
        },
      },
      visualMap: {
        type: 'piecewise',
        min: 0,
        max: 300,
        left: 10,
        bottom: 10,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: c.text, fontSize: 10 },
        pieces: AQI_LEVELS.map((l) => ({
          min: l.level === 1 ? 0 : AQI_LEVELS[l.level - 2].max + 1,
          max: l.level === 6 ? 500 : l.max,
          label: levelLabel(l.key),
          color: l.color,
        })),
      },
      geo: {
        map: CHINA_MAP_NAME,
        roam: true,
        zoom: 1.15,
        label: { show: false },
        itemStyle: {
          areaColor: c.area,
          borderColor: c.border,
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: { areaColor: c.isDark ? '#2a3a31' : '#e3efe7' },
          label: { show: false },
        },
      },
      series: [
        {
          name: 'AQI',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData.filter((d) => d.value[2] > 100),
          symbolSize: (val) => Math.max(6, Math.min(20, val[2] / 9)),
          rippleEffect: { brushType: 'stroke', scale: 2.6 },
          itemStyle: {
            color: (p) => aqiLevel(p.value[2]).color,
            shadowBlur: 6,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
          zlevel: 2,
        },
        {
          name: 'AQI',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData.filter((d) => d.value[2] <= 100),
          symbolSize: (val) => Math.max(5, Math.min(16, val[2] / 9)),
          itemStyle: {
            color: (p) => aqiLevel(p.value[2]).color,
            borderColor: 'rgba(255,255,255,0.7)',
            borderWidth: 0.6,
          },
          zlevel: 1,
        },
      ],
    },
    true,
  )
}

function renderBar(cities) {
  if (!barChart) return
  const c = themeColors()
  const list = [...cities].sort((a, b) => b.value - a.value).slice(0, 20)

  barChart.setOption(
    {
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        textStyle: { color: c.tooltipText, fontSize: 12 },
        formatter: (p) => `${p[0].axisValue}<br/>AQI <b>${p[0].data}</b>`,
      },
      xAxis: {
        type: 'category',
        data: list.map((d) => d.name),
        axisLine: { lineStyle: { color: c.border } },
        axisLabel: { color: c.text, fontSize: 10, interval: 0, rotate: 40 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: c.isDark ? '#232d27' : '#f0f3f0' } },
        axisLabel: { color: c.text, fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: list.map((d) => ({ value: d.value, itemStyle: { color: aqiLevel(d.value).color } })),
          barMaxWidth: 22,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    },
    true,
  )
}

function resize() {
  mapChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  echarts.registerMap(CHINA_MAP_NAME, CHINA_GEO_JSON)
  mapChart = echarts.init(mapEl.value)
  barChart = echarts.init(barEl.value)
  renderMap()
  renderBar(AQI_CITIES)
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  mapChart?.dispose()
  barChart?.dispose()
})

watch(locale, () => {
  renderMap()
  renderBar(selected.value.length ? selected.value : AQI_CITIES)
})

watch(
  () => document.documentElement.getAttribute('data-theme'),
  () => {
    renderMap()
    renderBar(selected.value.length ? selected.value : AQI_CITIES)
  },
)

function pickLevel(lv) {
  const cities = AQI_CITIES.filter((c) => aqiLevel(c.value).level === lv.level)
  selected.value = cities
  renderBar(cities)
}

function resetSelection() {
  selected.value = []
  renderBar(AQI_CITIES)
}
</script>

<template>
  <div class="aqi-map">
    <div class="map-stats">
      <div class="ms-item">
        <span class="ms-value mono">{{ summary.avg }}</span>
        <span class="ms-label">{{ t('map.avg') }}</span>
      </div>
      <div class="ms-item">
        <span class="ms-value mono" :style="{ color: aqiLevel(summary.max.value).color }">
          {{ summary.max.value }}
        </span>
        <span class="ms-label">{{ summary.max.name }} · {{ t('map.worst') }}</span>
      </div>
      <div class="ms-item">
        <span class="ms-value mono" :style="{ color: aqiLevel(summary.min.value).color }">
          {{ summary.min.value }}
        </span>
        <span class="ms-label">{{ summary.min.name }} · {{ t('map.best') }}</span>
      </div>
      <div class="ms-item">
        <span class="ms-value mono">{{ summary.count }}</span>
        <span class="ms-label">{{ t('map.cities') }}</span>
      </div>
    </div>

    <div class="dist-row">
      <button
        v-for="d in distribution"
        :key="d.key"
        class="dist-chip"
        :class="{ active: selected.length && selected[0] && aqiLevel(selected[0].value).level === d.level }"
        :style="{ '--dc': d.color }"
        @click="pickLevel(d)"
      >
        <span class="dist-dot"></span>
        <span class="dist-name">{{ levelLabel(d.key) }}</span>
        <span class="dist-count mono">{{ d.count }}</span>
      </button>
      <button v-if="selected.length" class="dist-reset" @click="resetSelection">
        {{ t('map.reset') }}
      </button>
    </div>

    <div ref="mapEl" class="map-canvas"></div>

    <div class="bar-head">
      <span>{{ selected.length ? t('map.selectedTop') : t('map.top20') }}</span>
      <span v-if="selected.length" class="muted">{{ t('map.selectedCount', { n: selected.length }) }}</span>
    </div>
    <div ref="barEl" class="bar-canvas"></div>

    <p class="map-note muted">{{ t('map.note') }}</p>
  </div>
</template>

<style scoped>
.aqi-map {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.ms-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.ms-value {
  font-size: 18px;
  font-weight: 700;
}

.ms-label {
  font-size: 10px;
  color: var(--text-3);
  text-align: center;
}

.dist-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.dist-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  background: var(--surface-2);
  font-size: 11px;
  color: var(--text-2);
  border: 1px solid transparent;
  transition: all 0.15s;
}

.dist-chip:hover {
  border-color: var(--dc);
}

.dist-chip.active {
  border-color: var(--dc);
  background: var(--surface);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dc) 25%, transparent);
}

.dist-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dc);
}

.dist-count {
  font-weight: 700;
}

.dist-reset {
  padding: 5px 12px;
  border-radius: 20px;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 11px;
  font-weight: 600;
}

.map-canvas {
  width: 100%;
  height: 420px;
}

.bar-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.bar-canvas {
  width: 100%;
  height: 200px;
}

.map-note {
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 600px) {
  .map-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .map-canvas {
    height: 300px;
  }
}
</style>
