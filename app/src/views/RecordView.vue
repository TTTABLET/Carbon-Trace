<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import { CATEGORIES, GRID_FACTORS, getFactorValue } from '../core/emissionFactors.js'
import { calcRecord } from '../core/calculator.js'

const { t, locale } = useI18n()
const store = useRecordsStore()

const category = ref('transport')
const activity = ref('carGasoline')
const amount = ref('')
const date = ref(store.todayKey)
const message = ref('')

const categoryList = computed(() =>
  Object.entries(CATEGORIES).map(([key, c]) => ({
    key,
    label: c.label[locale.value],
    icon: c.icon,
    color: c.color,
  })),
)

const activityList = computed(() => {
  const cat = CATEGORIES[category.value]
  if (!cat) return []
  return Object.entries(cat.factors).map(([key, f]) => ({
    key,
    label: f.label[locale.value],
    icon: f.icon,
    unit: f.unit,
  }))
})

const currentUnit = computed(() => {
  const cat = CATEGORIES[category.value]
  return cat?.factors?.[activity.value]?.unit || ''
})

const preview = computed(() => {
  const n = Number(amount.value)
  if (!n || n <= 0) return 0
  return calcRecord({
    category: category.value,
    activity: activity.value,
    amount: n,
    gridRegion: store.gridRegion,
  })
})

const currentFactor = computed(() =>
  getFactorValue(category.value, activity.value, store.gridRegion),
)

function selectCategory(key) {
  category.value = key
  const first = Object.keys(CATEGORIES[key].factors)[0]
  activity.value = first
}

async function submit() {
  const n = Number(amount.value)
  if (!n || n <= 0) {
    message.value = t('record.invalidAmount')
    return
  }
  await store.add({
    date: date.value,
    category: category.value,
    activity: activity.value,
    amount: n,
  })
  amount.value = ''
  message.value = t('record.saved')
  setTimeout(() => (message.value = ''), 1800)
}

const recent = computed(() => store.records.slice(0, 20))

function activityLabel(r) {
  const f = CATEGORIES[r.category]?.factors?.[r.activity]
  return f ? `${f.icon} ${f.label[locale.value]}` : r.activity
}

function categoryLabel(r) {
  return CATEGORIES[r.category]?.label?.[locale.value] || r.category
}

function recordEmission(r) {
  return calcRecord(r)
}
</script>

<template>
  <div class="record-view">
    <div class="card form-card">
      <div class="card-title">{{ t('record.title') }}</div>

      <div class="field">
        <label>{{ t('record.selectCategory') }}</label>
        <div class="cat-grid">
          <button
            v-for="c in categoryList"
            :key="c.key"
            class="cat-btn"
            :class="{ active: category === c.key }"
            :style="category === c.key ? { borderColor: c.color, background: c.color + '18' } : {}"
            @click="selectCategory(c.key)"
          >
            <span class="cat-icon">{{ c.icon }}</span>
            <span>{{ c.label }}</span>
          </button>
        </div>
      </div>

      <div class="field">
        <label>{{ t('record.selectActivity') }}</label>
        <div class="act-grid">
          <button
            v-for="a in activityList"
            :key="a.key"
            class="act-btn"
            :class="{ active: activity === a.key }"
            @click="activity = a.key"
          >
            <span class="act-icon">{{ a.icon }}</span>
            <span class="act-label">{{ a.label }}</span>
          </button>
        </div>
      </div>

      <div class="inline-fields">
        <div class="field">
          <label>{{ t('record.amount') }} ({{ currentUnit }})</label>
          <input
            v-model="amount"
            class="input"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            @keyup.enter="submit"
          />
        </div>
        <div class="field">
          <label>{{ t('record.date') }}</label>
          <input v-model="date" class="input" type="date" />
        </div>
      </div>

      <div v-if="category === 'energy' && activity === 'electricity'" class="field">
        <label>{{ t('record.gridRegion') }}</label>
        <select
          class="select"
          :value="store.gridRegion"
          @change="store.setGrid($event.target.value)"
        >
          <option v-for="(g, key) in GRID_FACTORS" :key="key" :value="key">
            {{ g.label[locale] }} ({{ g.value }} kg/kWh)
          </option>
        </select>
      </div>

      <div class="preview">
        <span class="muted">{{ t('common.total') }}</span>
        <span class="preview-value mono">{{ preview }}</span>
        <span class="muted">{{ t('common.unit') }}</span>
        <span class="preview-factor muted">
          ({{ currentFactor }} × {{ amount || 0 }} {{ currentUnit }})
        </span>
      </div>

      <div class="form-actions">
        <span v-if="message" class="msg">{{ message }}</span>
        <button class="btn btn-primary" @click="submit">{{ t('record.addRecord') }}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ t('record.recentRecords') }}</div>
      <div v-if="recent.length === 0" class="muted empty-row">{{ t('common.empty') }}</div>
      <ul v-else class="record-list">
        <li v-for="r in recent" :key="r.id" class="record-item">
          <div class="rec-main">
            <span class="rec-activity">{{ activityLabel(r) }}</span>
            <span class="rec-meta muted">
              {{ categoryLabel(r) }} · {{ r.amount }} · {{ r.date }}
            </span>
          </div>
          <div class="rec-right">
            <span class="rec-value mono">{{ recordEmission(r) }}</span>
            <button class="del-btn" :title="t('common.delete')" @click="store.remove(r.id)">
              ✕
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.record-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.field {
  margin-bottom: 16px;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-2);
  font-size: 12px;
  transition: all 0.15s;
}

.cat-btn:hover {
  border-color: var(--text-3);
}

.cat-btn.active {
  color: var(--text);
  font-weight: 600;
}

.cat-icon {
  font-size: 20px;
}

.act-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}

.act-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-2);
  font-size: 12px;
  transition: all 0.15s;
  text-align: left;
}

.act-btn:hover {
  border-color: var(--primary);
}

.act-btn.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.act-icon {
  font-size: 15px;
}

.act-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inline-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.preview {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 12px 14px;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  flex-wrap: wrap;
}

.preview-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.preview-factor {
  font-size: 11px;
  margin-left: auto;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.msg {
  font-size: 13px;
  color: var(--primary);
}

.empty-row {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
}

.record-list {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.record-item:last-child {
  border-bottom: none;
}

.rec-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.rec-activity {
  font-size: 13px;
  font-weight: 500;
}

.rec-meta {
  font-size: 11px;
}

.rec-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rec-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.del-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--text-3);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.del-btn:hover {
  background: var(--danger);
  color: #fff;
}

@media (max-width: 600px) {
  .cat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .inline-fields {
    grid-template-columns: 1fr;
  }
}
</style>