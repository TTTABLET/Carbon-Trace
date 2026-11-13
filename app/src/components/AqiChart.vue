<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
  mode: { type: String, default: 'hourly' },
})

const el = ref(null)
let chart = null

function aqiColor(v) {
  if (v <= 50) return '#2e9e5b'
  if (v <= 100) return '#c9b800'
  if (v <= 150) return '#ff7e00'
  if (v <= 200) return '#ff0000'
  if (v <= 300) return '#8f3f97'
  return '#7e0023'
}

function render() {
  if (!chart) return
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#a8b8ae' : '#5a6b60'
  const gridColor = isDark ? '#232d27' : '#f0f3f0'

  const isHourly = props.mode === 'hourly'
  const labels = props.data.map((d) => (isHourly ? d.hour + ':00' : d.date.slice(5)))
  const values = props.data.map((d) => (isHourly ? d.aqi : d.aqi))

  chart.setOption({
    grid: { left: 8, right: 12, top: 20, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#232d27' : '#fff',
      borderColor: isDark ? '#2e3a33' : '#e2e8e3',
      textStyle: { color: isDark ? '#e8f0ea' : '#1a2b1f', fontSize: 12 },
      formatter: (p) => `${p[0].axisValue}<br/>AQI <b>${p[0].data}</b>`,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: isDark ? '#2e3a33' : '#e2e8e3' } },
      axisLabel: { color: textColor, fontSize: 10, interval: isHourly ? 2 : 0 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: gridColor } },
      axisLabel: { color: textColor, fontSize: 10 },
    },
    series: [
      {
        type: isHourly ? 'line' : 'bar',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: { color: '#4A90D9', width: 2 },
        itemStyle: {
          color: (p) => aqiColor(p.data),
          borderRadius: isHourly ? 0 : [4, 4, 0, 0],
        },
        areaStyle: isHourly
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(74,144,217,0.3)' },
                { offset: 1, color: 'rgba(74,144,217,0)' },
              ]),
            }
          : undefined,
        barMaxWidth: 28,
      },
    ],
  })
}

function resize() {
  chart?.resize()
}

onMounted(() => {
  chart = echarts.init(el.value)
  render()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})

watch(() => [props.data, props.mode], render, { deep: true })
</script>

<template>
  <div ref="el" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 200px;
}
</style>
