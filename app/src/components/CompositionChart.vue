<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])
import { CATEGORIES } from '../core/emissionFactors.js'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  locale: { type: String, default: 'zh' },
})

const el = ref(null)
let chart = null

function render() {
  if (!chart) return
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#a8b8ae' : '#5a6b60'

  const items = Object.entries(props.data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: CATEGORIES[key]?.label?.[props.locale] || key,
      value,
      itemStyle: { color: CATEGORIES[key]?.color || '#999' },
    }))

  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#232d27' : '#fff',
      borderColor: isDark ? '#2e3a33' : '#e2e8e3',
      textStyle: { color: isDark ? '#e8f0ea' : '#1a2b1f', fontSize: 12 },
      formatter: (p) => `${p.name}<br/><b>${p.value}</b> kgCO₂e (${p.percent}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: textColor, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: isDark ? '#1b231e' : '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold', color: textColor },
        },
        data: items,
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

watch(() => [props.data, props.locale], render, { deep: true })
</script>

<template>
  <div ref="el" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 240px;
}
</style>