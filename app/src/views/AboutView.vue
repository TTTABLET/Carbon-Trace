<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import { exportData, importData } from '../core/db.js'

const { t } = useI18n()
const store = useRecordsStore()
const msg = ref('')

async function doExport() {
  const json = await exportData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `carbon-trace-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  msg.value = '✓'
  setTimeout(() => (msg.value = ''), 1500)
}

async function doImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const n = await importData(text)
    await store.load()
    msg.value = `+${n}`
    setTimeout(() => (msg.value = ''), 2000)
  } catch (err) {
    msg.value = '✗'
    setTimeout(() => (msg.value = ''), 2000)
  }
  e.target.value = ''
}

async function doClear() {
  if (confirm('确定要清空所有记录和树园吗？此操作不可恢复。')) {
    await store.clear()
  }
}
</script>

<template>
  <div class="about-view">
    <div class="card">
      <div class="about-head">
        <span class="logo">🌱</span>
        <div>
          <h2>{{ t('about.title') }}</h2>
          <p class="muted">{{ t('about.intro') }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.project') }}</div>
      <p class="muted note">{{ t('about.projectP1') }}</p>
      <p class="muted note">{{ t('about.projectP2') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.features') }}</div>
      <ul class="feat-list">
        <li v-for="i in 6" :key="i">{{ t(`about.feature${i}`) }}</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.design') }}</div>
      <p class="muted note">{{ t('about.designP1') }}</p>
      <p class="muted note">{{ t('about.designP2') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.tech') }}</div>
      <p class="muted note">{{ t('about.techP1') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.howItWorks') }}</div>
      <div class="formula mono">{{ t('about.formula') }}</div>
      <p class="muted note">{{ t('about.formulaNote') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.rewardTitle') }}</div>
      <div class="formula mono">{{ t('about.rewardFormula') }}</div>
      <div class="formula mono">{{ t('about.rewardFormula2') }}</div>
      <p class="muted note">{{ t('about.rewardNote') }}</p>
      <p class="muted note">{{ t('about.rewardExample') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.dataSource') }}</div>
      <p class="muted note">{{ t('about.dataSourceDesc') }}</p>
      <ul class="src-list">
        <li>生态环境部《省级温室气体清单编制指南》</li>
        <li>中国区域电网平均排放因子（2022）</li>
        <li>IPCC AR6 (2021)</li>
        <li>UK DEFRA GHG Conversion Factors (2023)</li>
        <li>Poore &amp; Nemecek, Science (2018)</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.privacy') }}</div>
      <p class="muted note">{{ t('about.privacyDesc') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('about.disclaimer') }}</div>
      <p class="muted note">{{ t('about.disclaimerDesc') }}</p>
    </div>

    <div class="card">
      <div class="card-title">{{ t('common.export') }} / {{ t('common.import') }}</div>
      <div class="data-actions">
        <button class="btn btn-ghost" @click="doExport">{{ t('common.export') }}</button>
        <label class="btn btn-ghost file-btn">
          {{ t('common.import') }}
          <input type="file" accept="application/json" hidden @change="doImport" />
        </label>
        <button class="btn btn-ghost danger" @click="doClear">{{ t('common.reset') }}</button>
        <span v-if="msg" class="msg">{{ msg }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about-head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 44px;
}

.about-head h2 {
  font-size: 18px;
  margin-bottom: 4px;
}

.about-head p {
  font-size: 13px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.formula {
  padding: 14px;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  color: var(--primary);
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  margin-bottom: 10px;
}

.note {
  font-size: 13px;
  line-height: 1.7;
}

.note + .note {
  margin-top: 10px;
}

.feat-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.9;
}

.feat-list li::marker {
  color: var(--primary);
}

.src-list {
  margin-top: 10px;
  padding-left: 20px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.9;
}

.data-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.file-btn {
  cursor: pointer;
}

.danger {
  color: var(--danger);
}

.msg {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}
</style>