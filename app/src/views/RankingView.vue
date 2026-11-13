<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import { generatePoster, downloadPoster } from '../core/poster.js'

const { t, locale } = useI18n()
const store = useRecordsStore()

const lb = computed(() => store.leaderboard)
const showPoster = ref(false)
const posterUrl = ref('')
const generating = ref(false)
const editProfile = ref(false)
const nameInput = ref('')
const avatarInput = ref('🙋')

const AVATARS = ['🙋', '🌌', '🌱', '🤼', '🦚', '🐧', '🌍', '☀️', '🚂', '🥗']

const medalColor = (rank) => {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return 'transparent'
}

function openProfile() {
  nameInput.value = store.profile.name ? store.profile.name[locale.value] : ''
  avatarInput.value = store.profile.avatar
  editProfile.value = true
}

async function saveProfile() {
  const name = nameInput.value.trim()
  await store.updateProfile({
    name: name ? { zh: name, en: name } : null,
    avatar: avatarInput.value,
  })
  editProfile.value = false
}

function posterData() {
  const me = lb.value.me
  return {
    name: store.profile.name ? store.profile.name[locale.value] : t('ranking.me'),
    avatar: store.profile.avatar,
    rating: me.rating,
    dailyAvg: me.dailyAvg,
    total: me.total,
    equivalents: store.equivalents,
    rank: me.rank,
    betterThan: lb.value.betterThan,
    locale: locale.value,
  }
}

async function makePoster() {
  generating.value = true
  showPoster.value = true
  posterUrl.value = await generatePoster(posterData())
  generating.value = false
}

async function download() {
  await downloadPoster(posterData())
}
</script>

<template>
  <div class="ranking-view">
    <div class="card header-card">
      <div>
        <div class="card-title">{{ t('ranking.title') }}</div>
        <p class="muted sub">{{ t('ranking.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="openProfile">👤 {{ t('ranking.myProfile') }}</button>
        <button class="btn btn-primary" :disabled="!store.records.length" @click="makePoster">
          🖼️ {{ t('ranking.sharePoster') }}
        </button>
      </div>
    </div>

    <div v-if="store.records.length" class="card summary-card">
      <div class="summary-item">
        <div class="summary-value mono" style="color: #2e9e5b">{{ lb.me.rank }}</div>
        <div class="summary-label">{{ t('ranking.rank') }}</div>
      </div>
      <div class="summary-item">
        <div class="summary-value mono">{{ lb.betterThan }}%</div>
        <div class="summary-label">{{ t('ranking.betterThan', { n: lb.betterThan }) }}</div>
      </div>
      <div class="summary-item">
        <div class="summary-value mono">{{ lb.avgOfAll }}</div>
        <div class="summary-label">{{ t('ranking.avgAll') }}</div>
      </div>
      <div class="summary-item">
        <div class="summary-value mono" :style="{ color: lb.gapToFirst > 0 ? '#F5A623' : '#2e9e5b' }">
          {{ lb.gapToFirst > 0 ? '+' + lb.gapToFirst : '0' }}
        </div>
        <div class="summary-label">{{ t('ranking.gapToFirst', { n: Math.abs(lb.gapToFirst) }) }}</div>
      </div>
    </div>

    <div class="card">
      <div class="lb-head">
        <span class="col-rank">{{ t('ranking.rank') }}</span>
        <span class="col-user">{{ t('ranking.user') }}</span>
        <span class="col-avg">{{ t('ranking.dailyAvg') }}</span>
        <span class="col-streak">{{ t('ranking.streak') }}</span>
      </div>
      <div
        v-for="row in lb.rows"
        :key="row.id"
        class="lb-row"
        :class="{ me: row.isMe }"
      >
        <span class="col-rank">
          <span class="rank-badge" :style="{ background: medalColor(row.rank) }">
            {{ row.rank }}
          </span>
        </span>
        <span class="col-user">
          <span class="avatar">{{ row.avatar }}</span>
          <span class="user-info">
            <span class="user-name">
              {{ row.name[locale] }}
              <span v-if="row.isMe" class="me-tag">{{ t('ranking.me') }}</span>
            </span>
            <span class="user-tag muted">{{ row.tagline[locale] }}</span>
          </span>
        </span>
        <span class="col-avg mono">{{ row.dailyAvg }}</span>
        <span class="col-streak mono">{{ row.streak }}{{ t('ranking.days') }}</span>
      </div>
    </div>

    <div v-if="!store.records.length" class="card empty">
      <div class="empty-icon">🏆</div>
      <p class="muted">{{ t('ranking.empty') }}</p>
    </div>

    <div v-if="editProfile" class="modal-mask" @click.self="editProfile = false">
      <div class="modal card">
        <div class="modal-title">{{ t('ranking.myProfile') }}</div>
        <div class="field">
          <label>{{ t('ranking.myAvatar') }}</label>
          <div class="avatar-picker">
            <button
              v-for="a in AVATARS"
              :key="a"
              class="avatar-opt"
              :class="{ active: avatarInput === a }"
              @click="avatarInput = a"
            >
              {{ a }}
            </button>
          </div>
        </div>
        <div class="field">
          <label>{{ t('ranking.myName') }}</label>
          <input v-model="nameInput" class="input" :placeholder="t('ranking.me')" maxlength="12" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="editProfile = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveProfile">{{ t('ranking.saveProfile') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showPoster" class="modal-mask" @click.self="showPoster = false">
      <div class="modal poster-modal">
        <div v-if="generating" class="poster-loading">{{ t('ranking.generating') }}</div>
        <img v-else :src="posterUrl" class="poster-img" alt="poster" />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showPoster = false">{{ t('common.close') }}</button>
          <button class="btn btn-primary" :disabled="generating" @click="download">
            ⬇️ {{ t('ranking.download') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranking-view {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  text-align: center;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.4;
}

.lb-head,
.lb-row {
  display: grid;
  grid-template-columns: 60px 1fr 100px 80px;
  align-items: center;
  gap: 12px;
}

.lb-head {
  padding: 0 12px 10px;
  font-size: 12px;
  color: var(--text-3);
  border-bottom: 1px solid var(--border);
}

.lb-row {
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.lb-row:hover {
  background: var(--surface-2);
}

.lb-row.me {
  background: var(--primary-light);
  border: 1px solid var(--primary);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  background: var(--surface-2);
}

.col-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.me-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
}

.user-tag {
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-avg {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.col-streak {
  font-size: 12px;
  color: var(--text-2);
}

.empty {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 8px;
}

.avatar-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.avatar-opt {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.avatar-opt:hover {
  border-color: var(--primary);
}

.avatar-opt.active {
  border-color: var(--primary);
  background: var(--primary-light);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.poster-modal {
  max-width: 380px;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.poster-img {
  width: 100%;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: block;
}

.poster-loading {
  padding: 100px 20px;
  text-align: center;
  color: #fff;
  font-size: 14px;
}

.poster-modal .modal-actions {
  background: var(--surface);
  padding: 12px;
  border-radius: var(--radius);
  margin-top: 12px;
}

@media (max-width: 600px) {
  .summary-card {
    grid-template-columns: repeat(2, 1fr);
  }
  .lb-head,
  .lb-row {
    grid-template-columns: 40px 1fr 70px;
  }
  .col-streak {
    display: none;
  }
}
</style>
