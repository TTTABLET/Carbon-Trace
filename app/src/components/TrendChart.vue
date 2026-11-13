<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
  label: { type: String, default: '' },
})

const el = ref(null)
let chart = null

function render() {
  if (!chart) return
  const dates = props.data.map((d) => d.date.slice(5))
  const values = props.data.map((d) => d.total)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#a8b8ae' : '#5a6b60'
  const lineColor = isDark ? '#3fb96e' : '#2e9e5b'

  chart.setOption({
    grid: { left: 8, right: 12, top: 20, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#232d27' : '#fff',
      borderColor: isDark ? '#2e3a33' : '#e2e8e3',
      textStyle: { color: isDark ? '#e8f0ea' : '#1a2b1f', fontSize: 12 },
      formatter: (p) => `${p[0].axisValue}<br/><b>${p[0].data}</b> kgCO₂e`,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: isDark ? '#2e3a33' : '#e2e8e3' } },
      axisLabel: { color: textColor, fontSize: 10, interval: Math.floor(dates.length / 8) },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? '#232d27' : '#f0f3f0' } },
      axisLabel: { color: textColor, fontSize: 10 },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: { color: lineColor, width: 2 },
        itemStyle: { color: lineColor },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(63,185,110,0.35)' : 'rgba(46,158,91,0.25)' },
            { offset: 1, color: 'rgba(46,158,91,0)' },
          ]),
        },
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

watch(() => props.data, render, { deep: true })
</script>

<template>
  <div ref="el" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 220px;
}
</style>