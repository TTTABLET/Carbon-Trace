<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from './stores/records.js'
import { toggleLocale } from './i18n/index.js'
import DashboardView from './views/DashboardView.vue'
import RecordView from './views/RecordView.vue'
import SuggestionsView from './views/SuggestionsView.vue'
import EcoView from './views/EcoView.vue'
import GardenView from './views/GardenView.vue'
import RankingView from './views/RankingView.vue'
import AboutView from './views/AboutView.vue'
import DebugPanel from './components/DebugPanel.vue'

const { t, locale } = useI18n()
const store = useRecordsStore()
const tab = ref('dashboard')
const theme = ref(localStorage.getItem('carbon-trace-theme') || 'light')

const tabs = computed(() => [
  { key: 'dashboard', label: t('nav.dashboard'), icon: '📊' },
  { key: 'record', label: t('nav.record'), icon: '✏️' },
  { key: 'suggestions', label: t('nav.suggestions'), icon: '💡' },
  { key: 'garden', label: t('nav.garden'), icon: '🌳' },
  { key: 'eco', label: t('nav.eco'), icon: '🌍' },
  { key: 'ranking', label: t('nav.ranking'), icon: '🏆' },
  { key: 'about', label: t('nav.about'), icon: 'ℹ️' },
])

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('carbon-trace-theme', theme.value)
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  applyTheme()
}

onMounted(async () => {
  applyTheme()
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  await store.load()
  await store.ensureSeeded()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="logo">🌱</span>
        <div class="brand-text">
          <h1>{{ t('app.name') }}</h1>
          <p>{{ t('app.tagline') }}</p>
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn" :title="t('common.language')" @click="toggleLocale">
          {{ locale === 'zh' ? '中' : 'EN' }}
        </button>
        <button class="icon-btn" :title="t('common.theme')" @click="toggleTheme">
          {{ theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>
    </header>

    <nav class="tabs">
      <button
        v-for="item in tabs"
        :key="item.key"
        class="tab"
        :class="{ active: tab === item.key }"
        @click="tab = item.key"
      >
        <span class="tab-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <main class="content">
      <DashboardView v-if="tab === 'dashboard'" @go-record="tab = 'record'" />
      <RecordView v-else-if="tab === 'record'" />
      <SuggestionsView v-else-if="tab === 'suggestions'" />
      <GardenView v-else-if="tab === 'garden'" />
      <EcoView v-else-if="tab === 'eco'" />
      <RankingView v-else-if="tab === 'ranking'" />
      <AboutView v-else />
    </main>

    <DebugPanel />
  </div>
</template>

<style scoped>
.app-shell {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px 48px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 16px;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 32px;
  line-height: 1;
}

.brand-text h1 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-text p {
  font-size: 12px;
  color: var(--text-3);
}

.actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.tabs {
  display: flex;
  gap: 4px;
  background: var(--surface);
  padding: 5px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 20px;
  overflow-x: auto;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab:hover {
  background: var(--surface-2);
  color: var(--text);
}

.tab.active {
  background: var(--primary);
  color: #fff;
}

.tab-icon {
  font-size: 15px;
}

.content {
  animation: fade 0.2s ease;
}

@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 600px) {
  .brand-text p {
    display: none;
  }
  .tab span:not(.tab-icon) {
    font-size: 12px;
  }
}
</style>