<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import { BENCHMARKS } from '../core/emissionFactors.js'
import TrendChart from '../components/TrendChart.vue'
import CompositionChart from '../components/CompositionChart.vue'

const emit = defineEmits(['go-record'])
const { t, locale } = useI18n()
const store = useRecordsStore()

const stats = computed(() => [
  { key: 'today', label: t('dashboard.todayEmission'), value: store.todayTotal, icon: '📅' },
  { key: 'week', label: t('dashboard.weekEmission'), value: store.weekTotal, icon: '🗓️' },
  { key: 'month', label: t('dashboard.monthEmission'), value: store.monthTotal, icon: '📆' },
  { key: 'total', label: t('dashboard.totalEmission'), value: store.total, icon: 'Σ' },
])

const comparisons = computed(() => {
  const avg = store.dailyAvg
  const rows = [
    { key: 'china', label: t('dashboard.vsChina'), base: BENCHMARKS.chinaDaily, color: '#F5A623' },
    { key: 'world', label: t('dashboard.vsWorld'), base: BENCHMARKS.worldDaily, color: '#4A90D9' },
    { key: 'target', label: t('dashboard.vsTarget'), base: BENCHMARKS.targetDaily, color: '#2e9e5b' },
  ]
  return rows.map((r) => ({
    ...r,
    ratio: r.base > 0 ? avg / r.base : 0,
    percent: Math.min(200, r.base > 0 ? (avg / r.base) * 100 : 0),
  }))
})

const equivalents = computed(() => [
  { label: t('dashboard.trees'), value: store.equivalents.trees, icon: '🌳' },
  { label: t('dashboard.kmDriving'), value: store.equivalents.kmDriving, icon: '🚗' },
  { label: t('dashboard.phoneCharges'), value: store.equivalents.phoneCharges, icon: '📱' },
  { label: t('dashboard.ledHours'), value: store.equivalents.ledHours, icon: '💡' },
])

const ratingColor = computed(() => {
  const map = { A: '#2e9e5b', B: '#7ED321', C: '#F5A623', D: '#E8834A', E: '#d9534f' }
  return map[store.rating.level] || '#999'
})

const hasData = computed(() => store.records.length > 0)
</script>

<template>
  <div class="dashboard">
    <div v-if="!hasData" class="empty card">
      <div class="empty-icon">🌍</div>
      <p>{{ t('dashboard.noData') }}</p>
      <button class="btn btn-primary" @click="emit('go-record')">
        {{ t('dashboard.goRecord') }}
      </button>
    </div>

    <template v-else>
      <section class="stat-grid">
        <div v-for="s in stats" :key="s.key" class="stat card">
          <div class="stat-head">
            <span class="stat-icon">{{ s.icon }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
          <div class="stat-value mono">
            {{ s.value }}
            <span class="stat-unit">{{ t('common.unit') }}</span>
          </div>
        </div>
      </section>

      <section class="row">
        <div class="card rating-card">
          <div class="card-title">{{ t('dashboard.rating') }}</div>
          <div class="rating-body">
            <div class="rating-badge" :style="{ background: ratingColor }">
              {{ store.rating.level }}
            </div>
            <div class="rating-info">
              <div class="rating-score mono">{{ store.rating.score }}<span>/100</span></div>
              <div class="rating-sub muted">
                {{ t('common.average') }} {{ store.dailyAvg }} {{ t('common.unit') }}
              </div>
            </div>
          </div>
        </div>

        <div class="card streak-card">
          <div class="card-title">{{ t('dashboard.streak') }}</div>
          <div class="streak-body">
            <div class="streak-num mono">{{ store.streak }}</div>
            <div class="streak-unit">{{ t('dashboard.days') }}</div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-title">{{ t('dashboard.trend') }}</div>
        <TrendChart :data="store.dailySeries" />
      </section>

      <section class="row">
        <div class="card">
          <div class="card-title">{{ t('dashboard.composition') }}</div>
          <CompositionChart :data="store.byCategory" :locale="locale" />
        </div>

        <div class="card">
          <div class="card-title">{{ t('dashboard.comparison') }}</div>
          <div class="compare-list">
            <div v-for="c in comparisons" :key="c.key" class="compare-item">
              <div class="compare-head">
                <span>{{ c.label }}</span>
                <span class="mono" :style="{ color: c.color }">
                  {{ c.ratio.toFixed(2) }}×
                </span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: Math.min(100, c.percent / 2) + '%', background: c.color }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-title">{{ t('dashboard.equivalents') }}</div>
        <div class="equiv-grid">
          <div v-for="e in equivalents" :key="e.label" class="equiv-item">
            <span class="equiv-icon">{{ e.icon }}</span>
            <span class="equiv-value mono">{{ e.value }}</span>
            <span class="equiv-label">{{ e.label }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 56px;
}

.empty p {
  color: var(--text-2);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat {
  padding: 16px;
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.stat-icon {
  font-size: 14px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-3);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.stat-unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-3);
  margin-left: 2px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text);
}

.rating-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rating-badge {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 800;
  color: #fff;
}

.rating-score {
  font-size: 26px;
  font-weight: 700;
}

.rating-score span {
  font-size: 13px;
  color: var(--text-3);
  font-weight: 400;
}

.rating-sub {
  font-size: 12px;
}

.streak-body {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.streak-num {
  font-size: 44px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.streak-unit {
  font-size: 14px;
  color: var(--text-3);
}

.compare-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}

.compare-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--text-2);
}

.bar-track {
  height: 8px;
  background: var(--surface-2);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.equiv-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.equiv-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  text-align: center;
}

.equiv-icon {
  font-size: 22px;
}

.equiv-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}

.equiv-label {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.3;
}

@media (max-width: 720px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .row {
    grid-template-columns: 1fr;
  }
  .equiv-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>