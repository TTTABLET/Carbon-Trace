<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import { CITIES } from '../core/ecoStatus.js'
import AqiChart from '../components/AqiChart.vue'
import AqiMap from '../components/AqiMap.vue'

const { t, locale } = useI18n()
const store = useRecordsStore()

const eco = computed(() => store.ecoStatus)

const pollutantList = computed(() => {
  const p = eco.value.pollutants
  return [
    { key: 'pm25', label: t('eco.pm25'), value: p.pm25, unit: t('eco.unitUgm3'), limit: 75 },
    { key: 'pm10', label: t('eco.pm10'), value: p.pm10, unit: t('eco.unitUgm3'), limit: 150 },
    { key: 'o3', label: t('eco.o3'), value: p.o3, unit: t('eco.unitUgm3'), limit: 160 },
    { key: 'no2', label: t('eco.no2'), value: p.no2, unit: t('eco.unitUgm3'), limit: 80 },
    { key: 'so2', label: t('eco.so2'), value: p.so2, unit: t('eco.unitUgm3'), limit: 150 },
    { key: 'co', label: t('eco.co'), value: p.co, unit: t('eco.unitMgm3'), limit: 4 },
  ]
})

const weatherList = computed(() => {
  const w = eco.value.weather
  return [
    { icon: '🌡️', label: t('eco.temperature'), value: w.temperature + ' °C' },
    { icon: '💧', label: t('eco.humidity'), value: w.humidity + ' %' },
    { icon: '🌬️', label: t('eco.wind'), value: w.windSpeed + ' m/s' },
    { icon: '🧭', label: t('eco.windDir'), value: w.windDir },
    { icon: '☀️', label: t('eco.uv'), value: w.uvIndex },
    { icon: '📊', label: t('eco.pressure'), value: w.pressure + ' hPa' },
    { icon: '👁️', label: t('eco.visibility'), value: w.visibility + ' km' },
    { icon: '🌅', label: t('eco.sunrise'), value: eco.value.sun.sunrise },
    { icon: '🌇', label: t('eco.sunset'), value: eco.value.sun.sunset },
  ]
})

function pollutantPercent(item) {
  return Math.min(100, (item.value / item.limit) * 100)
}

function pollutantColor(item) {
  const r = item.value / item.limit
  if (r <= 0.5) return '#2e9e5b'
  if (r <= 0.8) return '#F5A623'
  return '#d9534f'
}
</script>

<template>
  <div class="eco-view">
    <div class="card hero-card">
      <div class="hero-left">
        <div class="city-row">
          <select class="select city-select" :value="store.cityId" @change="store.setCity($event.target.value)">
            <option v-for="c in CITIES" :key="c.id" :value="c.id">{{ c.name[locale] }}</option>
          </select>
          <span class="date muted">{{ eco.date }}</span>
        </div>
        <div class="aqi-block">
          <div class="aqi-value mono" :style="{ color: eco.level.color }">{{ eco.aqi }}</div>
          <div class="aqi-info">
            <div class="aqi-label">{{ t('eco.aqi') }}</div>
            <div class="aqi-level" :style="{ background: eco.level.color }">
              {{ locale === 'zh' ? eco.level.zh : eco.level.en }}
            </div>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <div class="advice-list">
          <div v-for="(a, i) in eco.advice" :key="i" class="advice-item">
            <span class="advice-dot"></span>
            <span>{{ a[locale] }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ t('eco.nationalMap') }}</div>
      <AqiMap />
    </div>

    <div class="card">
      <div class="card-title">{{ t('eco.hourly') }}</div>
      <AqiChart :data="store.hourlyAqi" mode="hourly" />
    </div>

    <div class="card">
      <div class="card-title">{{ t('eco.weekly') }}</div>
      <AqiChart :data="store.weeklyAqi" mode="weekly" />
    </div>

    <div class="card">
      <div class="card-title">{{ t('eco.pollutants') }}</div>
      <div class="pollutant-grid">
        <div v-for="p in pollutantList" :key="p.key" class="pollutant-item">
          <div class="pollutant-head">
            <span class="pollutant-label">{{ p.label }}</span>
            <span class="pollutant-value mono">{{ p.value }} <small>{{ p.unit }}</small></span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: pollutantPercent(p) + '%', background: pollutantColor(p) }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ t('eco.weather') }}</div>
      <div class="weather-grid">
        <div v-for="w in weatherList" :key="w.label" class="weather-item">
          <span class="weather-icon">{{ w.icon }}</span>
          <span class="weather-value mono">{{ w.value }}</span>
          <span class="weather-label">{{ w.label }}</span>
        </div>
      </div>
    </div>

    <p class="disclaimer muted">{{ t('eco.disclaimer') }}</p>
  </div>
</template>

<style scoped>
.eco-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: center;
}

.city-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.city-select {
  width: auto;
  min-width: 120px;
}

.date {
  font-size: 12px;
}

.aqi-block {
  display: flex;
  align-items: center;
  gap: 20px;
}

.aqi-value {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
}

.aqi-label {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 6px;
}

.aqi-level {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.advice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
}

.advice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: 7px;
  flex-shrink: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
}

.pollutant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}

.pollutant-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.pollutant-label {
  font-size: 13px;
  color: var(--text-2);
}

.pollutant-value {
  font-size: 14px;
  font-weight: 600;
}

.pollutant-value small {
  font-size: 10px;
  color: var(--text-3);
  font-weight: 400;
}

.bar-track {
  height: 6px;
  background: var(--surface-2);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.weather-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  text-align: center;
}

.weather-icon {
  font-size: 20px;
}

.weather-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.weather-label {
  font-size: 11px;
  color: var(--text-3);
}

.disclaimer {
  font-size: 11px;
  text-align: center;
  line-height: 1.6;
  padding: 0 20px;
}

@media (max-width: 720px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
  .pollutant-grid {
    grid-template-columns: 1fr;
  }
  .aqi-value {
    font-size: 56px;
  }
}
</style>
