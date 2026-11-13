<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import { generateSuggestions, totalPotential } from '../core/suggestions.js'
import { CATEGORIES } from '../core/emissionFactors.js'

const { t, locale } = useI18n()
const store = useRecordsStore()

const suggestions = computed(() => generateSuggestions(store.records, 8))
const potential = computed(() => totalPotential(suggestions.value))

const difficultyLabel = (d) => {
  if (d === 1) return t('suggestions.easy')
  if (d === 2) return t('suggestions.medium')
  return t('suggestions.hard')
}

const difficultyColor = (d) => (d === 1 ? '#2e9e5b' : d === 2 ? '#F5A623' : '#d9534f')

const categoryInfo = (key) => CATEGORIES[key] || { label: {}, icon: '•', color: '#999' }
</script>

<template>
  <div class="suggestions-view">
    <div class="card header-card">
      <div>
        <div class="card-title">{{ t('suggestions.title') }}</div>
        <p class="muted sub">{{ t('suggestions.subtitle') }}</p>
      </div>
      <div v-if="store.records.length" class="potential">
        <span class="muted">{{ t('suggestions.potential') }}</span>
        <span class="potential-value mono">{{ potential }}</span>
        <span class="muted">{{ t('common.unit') }}/{{ t('suggestions.perYear') }}</span>
      </div>
    </div>

    <div v-if="!store.records.length" class="card empty">
      <div class="empty-icon">💡</div>
      <p class="muted">{{ t('suggestions.noData') }}</p>
    </div>

    <div v-else class="tip-grid">
      <div v-for="s in suggestions" :key="s.id" class="tip card">
        <div class="tip-head">
          <span class="tip-cat" :style="{ background: categoryInfo(s.category).color + '20', color: categoryInfo(s.category).color }">
            {{ categoryInfo(s.category).icon }} {{ categoryInfo(s.category).label[locale] }}
          </span>
          <span class="tip-diff" :style="{ color: difficultyColor(s.difficulty) }">
            {{ difficultyLabel(s.difficulty) }}
          </span>
        </div>
        <h3 class="tip-title">{{ s.title[locale] }}</h3>
        <p class="tip-desc muted">{{ s.desc[locale] }}</p>
        <div class="tip-foot">
          <span class="muted">{{ t('suggestions.impact') }}</span>
          <span class="tip-impact mono">−{{ s.impact }} {{ t('common.unit') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.suggestions-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.sub {
  font-size: 12px;
}

.potential {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}

.potential-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.empty {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.tip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.tip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.tip:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.tip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tip-cat {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 500;
}

.tip-diff {
  font-size: 11px;
  font-weight: 600;
}

.tip-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.tip-desc {
  font-size: 12px;
  line-height: 1.6;
  flex: 1;
}

.tip-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 12px;
}

.tip-impact {
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
}
</style>