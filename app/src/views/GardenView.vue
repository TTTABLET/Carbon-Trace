<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordsStore } from '../stores/records.js'
import Orchard3D from '../components/Orchard3D.vue'
import {
  TREE_STAGES,
  MAX_STAGE,
  TREE_SPECIES,
  treeState,
} from '../core/growth.js'

const { t, locale } = useI18n()
const store = useRecordsStore()

const toast = ref('')
const visiting = ref(null)
const planting = ref(false)
const pickedSpecies = ref('common')
const selectedId = ref(null)

const info = computed(() => store.growthInfo)
const trees = computed(() => info.value.trees || [])
const growingTrees = computed(() => trees.value.filter((tr) => tr.stage < MAX_STAGE))

/** 用户选中的树; 未选中时回退到第一棵未长成的树 */
const activeTree = computed(() => {
  const list = growingTrees.value
  if (!list.length) return null
  return list.find((tr) => tr.id === selectedId.value) || list[0]
})
const activeState = computed(() =>
  activeTree.value
    ? treeState(activeTree.value.stage, activeTree.value.progress, activeTree.value.speciesId)
    : null,
)
const allGrown = computed(() => trees.value.length > 0 && !activeTree.value)
const unlocked = computed(() => store.unlockedTreeSpecies)
const nextSp = computed(() => info.value.nextSpecies)

const stages = computed(() =>
  TREE_STAGES.map((s) => ({
    ...s,
    label: locale.value === 'zh' ? s.zh : s.en,
    reached: activeState.value ? s.stage <= activeState.value.stage : false,
    current: activeState.value ? s.stage === activeState.value.stage : false,
  })),
)

const waterOptions = [20, 50, 100, 200]

const canWater = computed(() => info.value.energy > 0 && !!activeTree.value)

const gardenFriends = computed(() => store.friends)

/** 树林按树种分组, 用于可视化排列 */
const groveGroups = computed(() => {
  const map = new Map()
  for (const tr of trees.value) {
    const sp = TREE_SPECIES.find((s) => s.id === tr.speciesId) || TREE_SPECIES[0]
    if (!map.has(sp.id)) map.set(sp.id, { species: sp, items: [] })
    map.get(sp.id).items.push(tr)
  }
  return [...map.values()]
})

function treeIcon(tr) {
  const sp = TREE_SPECIES.find((s) => s.id === tr.speciesId) || TREE_SPECIES[0]
  return sp.icons[Math.min(MAX_STAGE, tr.stage)]
}

function treeLabel(tr) {
  const sp = TREE_SPECIES.find((s) => s.id === tr.speciesId) || TREE_SPECIES[0]
  const st = TREE_STAGES[Math.min(MAX_STAGE, tr.stage)]
  return `${locale.value === 'zh' ? sp.zh : sp.en} · ${locale.value === 'zh' ? st.zh : st.en}`
}

function treePercent(tr) {
  const st = treeState(tr.stage, tr.progress, tr.speciesId)
  return st.totalPercent
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => {
    toast.value = ''
  }, 2200)
}

async function doWater(amount) {
  const target = activeTree.value
  if (!target) {
    showToast(t('garden.noEnergy'))
    return
  }
  const r = await store.waterTreeById(target.id, amount)
  if (!r.ok) {
    showToast(t('garden.noEnergy'))
    return
  }
  if (r.completed) showToast(t('garden.treeDone'))
  else if (r.leveledUp) showToast(t('garden.stageUp'))
  else showToast(t('garden.watered', { n: r.spent }))
}

async function doPlant() {
  const r = await store.plantTree(pickedSpecies.value)
  planting.value = false
  showToast(t('garden.planted', { name: locale.value === 'zh' ? r.species.zh : r.species.en }))
}

async function doSettle() {
  const r = await store.settleRewards()
  if (r.xp > 0) showToast(t('garden.settled', { xp: r.xp, energy: r.ge }))
  else showToast(t('garden.nothingToSettle'))
}

async function doCollect() {
  const r = await store.collectYield()
  if (r.ok) showToast(t('garden.yieldCollected', { n: r.amount }))
  else showToast(t('garden.yieldDone'))
}

function openFriend(f) {
  visiting.value = f
}

function closeFriend() {
  visiting.value = null
}

function onPickTree(tr) {
  if (!tr) return
  if (tr.stage >= MAX_STAGE) {
    showToast(t('garden.alreadyGrown'))
    return
  }
  selectedId.value = tr.id
}
</script>

<template>
  <div class="garden-view">
    <!-- 等级卡 -->
    <div class="card level-card">
      <div class="level-head">
        <div class="level-badge">
          <span class="level-icon">{{ info.title.icon }}</span>
          <div>
            <div class="level-num">Lv.{{ info.level }}</div>
            <div class="level-title">{{ locale === 'zh' ? info.title.zh : info.title.en }}</div>
          </div>
        </div>
        <div class="level-stats">
          <div class="stat">
            <span class="stat-value mono">{{ info.xp }}</span>
            <span class="stat-label">{{ t('garden.xp') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value mono energy">{{ info.energy }}</span>
            <span class="stat-label">{{ t('garden.energy') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value mono">{{ info.totalSaved }}</span>
            <span class="stat-label">{{ t('garden.saved') }}</span>
          </div>
        </div>
      </div>

      <div class="xp-track">
        <div class="xp-fill" :style="{ width: info.percent + '%' }"></div>
      </div>
      <div class="xp-hint">
        <span>{{ t('garden.toNext', { n: info.remaining }) }}</span>
        <span class="muted">{{ t('garden.kgHint', { n: info.kgToNextLevel }) }}</span>
      </div>

      <div class="action-row">
        <button class="settle-btn" @click="doSettle">{{ t('garden.settle') }}</button>
        <button
          v-if="info.dailyYield > 0"
          class="yield-btn"
          :disabled="store.yieldCollected"
          @click="doCollect"
        >
          🍎 {{ t('garden.collectYield', { n: store.pendingYield || info.dailyYield }) }}
        </button>
      </div>
    </div>

    <!-- 树林 -->
    <div class="card grove-card">
      <div class="card-title">
        <span>{{ t('garden.myGrove') }}</span>
        <span class="grove-count">{{ t('garden.treeCount', { n: trees.length }) }}</span>
      </div>

      <div v-if="trees.length === 0" class="grove-empty">
        <div class="empty-icon">🌱</div>
        <p>{{ t('garden.emptyGrove') }}</p>
        <button class="plant-cta" @click="planting = true">{{ t('garden.plantFirst') }}</button>
      </div>

      <template v-else>
        <!-- 3D 果园 -->
        <Orchard3D
          :trees="trees"
          :grid-size="6"
          :selected-id="activeTree ? activeTree.id : null"
          height="440px"
          @pick="onPickTree"
        />
        <p class="orchard-hint muted">{{ t('garden.orchardHint') }}</p>

        <!-- 当前成长中的树 -->
        <div v-if="activeState" class="tree-stage">
          <div class="tree-icon">{{ activeState.icon }}</div>
          <div class="tree-name">
            {{ locale === 'zh' ? activeState.species.zh : activeState.species.en }} ·
            {{ locale === 'zh' ? activeState.name.zh : activeState.name.en }}
          </div>
          <div class="tree-progress">
            <div class="tree-track">
              <div class="tree-fill" :style="{ width: activeState.percent + '%' }"></div>
            </div>
            <div class="tree-hint mono">
              {{ activeState.progress }} / {{ activeState.cost }} {{ t('garden.ge') }}
            </div>
          </div>
        </div>
        <div v-else class="tree-done">🎉 {{ t('garden.allGrown') }}</div>

        <!-- 选择要浇灌的树 -->
        <div v-if="growingTrees.length > 1" class="tree-picker">
          <div class="picker-label">{{ t('garden.pickTreeToWater') }}</div>
          <div class="picker-row">
            <button
              v-for="tr in growingTrees"
              :key="tr.id"
              class="picker-chip"
              :class="{ on: activeTree && tr.id === activeTree.id }"
              @click="selectedId = tr.id"
            >
              <span class="chip-icon">{{ treeIcon(tr) }}</span>
              <span class="chip-name">{{ treeLabel(tr) }}</span>
            </button>
          </div>
        </div>

        <!-- 阶段路线 -->
        <div class="stage-road">
          <div
            v-for="s in stages"
            :key="s.stage"
            class="stage-node"
            :class="{ reached: s.reached, current: s.current }"
          >
            <span class="stage-icon">{{ s.icon }}</span>
            <span class="stage-label">{{ s.label }}</span>
          </div>
        </div>

        <!-- 浇水 -->
        <div v-if="activeTree" class="water-row">
          <button
            v-for="a in waterOptions"
            :key="a"
            class="water-btn"
            :disabled="!canWater || info.energy < a"
            @click="doWater(a)"
          >
            💧 {{ a }}
          </button>
          <button class="water-btn all" :disabled="!canWater" @click="doWater(info.energy)">
            {{ t('garden.waterAll') }}
          </button>
        </div>

        <button class="plant-cta wide" @click="planting = true">
          🌱 {{ t('garden.plantNew') }}
        </button>
      </template>

      <p class="tree-tip muted">{{ t('garden.tip') }}</p>
    </div>

    <!-- 树种图鉴 -->
    <div class="card">
      <div class="card-title">
        <span>{{ t('garden.speciesBook') }}</span>
        <span class="grove-count">
          {{ t('garden.unlockedCount', { a: unlocked.length, b: TREE_SPECIES.length }) }}
        </span>
      </div>
      <div class="species-grid">
        <div
          v-for="sp in TREE_SPECIES"
          :key="sp.id"
          class="species-card"
          :class="{ locked: info.treesCompleted < sp.unlockAt }"
          :style="{ '--sc': sp.color }"
        >
          <div class="species-icon">{{ sp.icons[MAX_STAGE] }}</div>
          <div class="species-name">{{ locale === 'zh' ? sp.zh : sp.en }}</div>
          <div class="species-desc">{{ sp.desc[locale] }}</div>
          <div v-if="info.treesCompleted < sp.unlockAt" class="species-lock">
            🔒 {{ t('garden.unlockAt', { n: sp.unlockAt }) }}
          </div>
          <div v-else class="species-open">✓ {{ t('garden.unlocked') }}</div>
        </div>
      </div>
      <p v-if="nextSp" class="species-hint">
        {{ t('garden.nextUnlock', { n: nextSp.unlockAt - info.treesCompleted, name: nextSp[locale] }) }}
      </p>
    </div>

    <!-- 好友 -->
    <div class="card">
      <div class="card-title">
        <span>{{ t('garden.friends') }}</span>
        <span class="rank-chip">{{ t('garden.myRank', { n: store.myRankAmongFriends }) }}</span>
      </div>
      <div class="friend-grid">
        <button
          v-for="f in gardenFriends"
          :key="f.id"
          class="friend-card"
          :style="{ '--fc': f.color }"
          @click="openFriend(f)"
        >
          <div class="friend-top">
            <span class="friend-avatar">{{ f.avatar }}</span>
            <span v-if="f.online" class="online-dot"></span>
          </div>
          <div class="friend-name">{{ f.name[locale] }}</div>
          <div class="friend-level">
            Lv.{{ f.level }} · {{ locale === 'zh' ? f.title.zh : f.title.en }}
          </div>
          <div class="friend-tree">
            <span class="friend-tree-icon">🌳</span>
            <span class="friend-tree-name">{{ t('garden.treeCount', { n: f.treeCount }) }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- 数据用途声明 -->
    <div class="card pledge-card">
      <div class="pledge-icon">🌍</div>
      <div class="pledge-title">{{ t('garden.pledgeTitle') }}</div>
      <p class="pledge-text">{{ t('garden.pledge') }}</p>
    </div>

    <!-- 种树弹窗 -->
    <div v-if="planting" class="modal-mask" @click.self="planting = false">
      <div class="modal">
        <button class="modal-close" @click="planting = false">✕</button>
        <div class="modal-title">{{ t('garden.pickSpecies') }}</div>
        <div class="pick-grid">
          <button
            v-for="sp in TREE_SPECIES"
            :key="sp.id"
            class="pick-card"
            :class="{
              locked: info.treesCompleted < sp.unlockAt,
              picked: pickedSpecies === sp.id,
            }"
            :style="{ '--sc': sp.color }"
            :disabled="info.treesCompleted < sp.unlockAt"
            @click="pickedSpecies = sp.id"
          >
            <span class="pick-icon">{{ sp.icons[MAX_STAGE] }}</span>
            <span class="pick-name">{{ locale === 'zh' ? sp.zh : sp.en }}</span>
            <span v-if="info.treesCompleted < sp.unlockAt" class="pick-lock">
              🔒 {{ sp.unlockAt }}
            </span>
          </button>
        </div>
        <button class="plant-confirm" @click="doPlant">{{ t('garden.confirmPlant') }}</button>
      </div>
    </div>

    <!-- 好友参观弹窗 -->
    <div v-if="visiting" class="modal-mask" @click.self="closeFriend">
      <div class="modal">
        <button class="modal-close" @click="closeFriend">✕</button>
        <div class="visit-head">
          <span class="visit-avatar">{{ visiting.avatar }}</span>
          <div>
            <div class="visit-name">{{ visiting.name[locale] }}</div>
            <div class="visit-tag">{{ visiting.tagline[locale] }}</div>
          </div>
        </div>
        <p class="visit-motto">“{{ visiting.motto[locale] }}”</p>

        <div class="visit-stats">
          <div class="visit-stat">
            <span class="mono">{{ visiting.level }}</span>
            <small>{{ t('garden.level') }}</small>
          </div>
          <div class="visit-stat">
            <span class="mono">{{ visiting.xp }}</span>
            <small>{{ t('garden.xp') }}</small>
          </div>
          <div class="visit-stat">
            <span class="mono">{{ visiting.lifetimeSaved }}</span>
            <small>{{ t('garden.saved') }}</small>
          </div>
          <div class="visit-stat">
            <span class="mono">{{ visiting.joinedDays }}</span>
            <small>{{ t('garden.days') }}</small>
          </div>
        </div>

        <div class="visit-garden">
          <Orchard3D
            :trees="visiting.trees"
            :grid-size="6"
            :interactive="false"
            height="300px"
          />
          <div class="visit-forest">
            🌳 {{ t('garden.treeCount', { n: visiting.treeCount }) }} ·
            {{ t('garden.speciesCount', { n: visiting.speciesCount }) }}
          </div>
        </div>

        <p class="visit-desc">{{ visiting.desc[locale] }}</p>
      </div>
    </div>

    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<style scoped>
.garden-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rank-chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--primary);
  background: var(--primary-light);
  padding: 3px 10px;
  border-radius: 20px;
}

.grove-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-3);
}

/* 等级卡 */
.level-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-icon {
  font-size: 34px;
  line-height: 1;
}

.level-num {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.level-title {
  font-size: 12px;
  color: var(--text-3);
}

.level-stats {
  display: flex;
  gap: 22px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
}

.stat-value.energy {
  color: #2e9e5b;
}

.stat-label {
  font-size: 11px;
  color: var(--text-3);
}

.xp-track {
  height: 10px;
  background: var(--surface-2);
  border-radius: 5px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, #4caf7d, #2e9e5b);
  transition: width 0.5s ease;
}

.xp-hint {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-2);
  margin-top: 8px;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.settle-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
  font-size: 13px;
  transition: all 0.15s;
}

.settle-btn:hover {
  background: var(--primary);
  color: #fff;
}

.yield-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
  font-size: 13px;
  transition: all 0.15s;
}

.yield-btn:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}

.yield-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 树林 */
.grove-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 0;
}

.empty-icon {
  font-size: 52px;
}

.grove-empty p {
  font-size: 13px;
  color: var(--text-3);
}

.plant-cta {
  padding: 10px 22px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.15s;
}

.plant-cta:hover {
  filter: brightness(1.08);
}

.plant-cta.wide {
  width: 100%;
  margin-top: 12px;
  background: var(--primary-light);
  color: var(--primary);
}

.plant-cta.wide:hover {
  background: var(--primary);
  color: #fff;
}

.orchard-hint {
  margin: 8px 0 18px;
  font-size: 12px;
  text-align: center;
}

.grove-row-label {
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
}

.grove-row-num {
  color: var(--text-3);
  font-weight: 500;
}

.grove-plants {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.plant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 2px;
  border-radius: 6px;
  transition: transform 0.15s;
}

.plant:hover {
  transform: translateY(-3px);
}

.plant-icon {
  font-size: 26px;
  line-height: 1;
}

.plant.grown .plant-icon {
  animation: sway 3.5s ease-in-out infinite;
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

.plant-bar {
  width: 26px;
  height: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.plant-fill {
  display: block;
  height: 100%;
  background: #2e9e5b;
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* 当前树 */
.tree-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 20px;
}

.tree-icon {
  font-size: 68px;
  line-height: 1;
}

.tree-name {
  font-size: 14px;
  font-weight: 600;
}

.tree-progress {
  width: 100%;
  max-width: 320px;
}

.tree-track {
  height: 8px;
  background: var(--surface-2);
  border-radius: 4px;
  overflow: hidden;
}

.tree-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #7ed957, #2e9e5b);
  transition: width 0.5s ease;
}

.tree-hint {
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
  margin-top: 6px;
}

.tree-done {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #2e9e5b;
  padding: 14px 0;
}

.stage-road {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.stage-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  opacity: 0.35;
  transition: all 0.2s;
}

.stage-node.reached {
  opacity: 1;
}

.stage-node.current .stage-icon {
  transform: scale(1.25);
}

.stage-node.current .stage-label {
  color: var(--primary);
  font-weight: 600;
}

.stage-icon {
  font-size: 20px;
  transition: transform 0.2s;
}

.stage-label {
  font-size: 10px;
  color: var(--text-3);
  white-space: nowrap;
}

.tree-picker {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.picker-label {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}

.picker-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.picker-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.16s;
}

.picker-chip:hover {
  border-color: var(--green);
  color: var(--green);
}

.picker-chip.on {
  background: var(--green);
  border-color: var(--green);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(46, 160, 67, 0.32);
}

.chip-icon {
  font-size: 14px;
}

.chip-name {
  white-space: nowrap;
}

.water-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.water-btn {
  flex: 1;
  min-width: 64px;
  padding: 10px 8px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  transition: all 0.15s;
}

.water-btn:hover:not(:disabled) {
  background: #2e9e5b;
  color: #fff;
}

.water-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.water-btn.all {
  background: var(--primary-light);
  color: var(--primary);
}

.tree-tip {
  font-size: 11px;
  text-align: center;
  margin-top: 12px;
  line-height: 1.6;
}

/* 树种图鉴 */
.species-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.species-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 14px 8px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid transparent;
  text-align: center;
  transition: all 0.15s;
}

.species-card:not(.locked) {
  border-color: var(--sc);
}

.species-card.locked {
  opacity: 0.45;
}

.species-icon {
  font-size: 30px;
  line-height: 1;
}

.species-name {
  font-size: 12px;
  font-weight: 600;
}

.species-desc {
  font-size: 10px;
  color: var(--text-3);
  line-height: 1.4;
}

.species-lock {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 2px;
}

.species-open {
  font-size: 10px;
  color: #2e9e5b;
  font-weight: 600;
  margin-top: 2px;
}

.species-hint {
  font-size: 11px;
  color: var(--text-2);
  text-align: center;
  margin-top: 12px;
}

/* 好友 */
.friend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.friend-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 1px solid transparent;
  transition: all 0.15s;
  text-align: center;
}

.friend-card:hover {
  border-color: var(--fc);
  transform: translateY(-2px);
}

.friend-top {
  position: relative;
}

.friend-avatar {
  font-size: 30px;
  line-height: 1;
}

.online-dot {
  position: absolute;
  right: -2px;
  bottom: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2e9e5b;
  border: 2px solid var(--surface-2);
}

.friend-name {
  font-size: 13px;
  font-weight: 600;
}

.friend-level {
  font-size: 10px;
  color: var(--text-3);
}

.friend-tree {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-2);
}

.friend-tree-icon {
  font-size: 14px;
}

/* 声明 */
.pledge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  background: linear-gradient(135deg, #eaf7ef 0%, #f2f9f5 100%);
  border: 1px solid #cfe9da;
}

.pledge-icon {
  font-size: 34px;
}

.pledge-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f7a4d;
}

.pledge-text {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.7;
  max-width: 560px;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
  animation: fade 0.15s ease;
}

.modal {
  position: relative;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  width: 100%;
  max-width: 440px;
  max-height: 86vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  animation: pop 0.2s ease;
}

@keyframes pop {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-3);
  font-size: 12px;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 16px;
}

.pick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.pick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 6px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  border: 2px solid transparent;
  transition: all 0.15s;
}

.pick-card.picked {
  border-color: var(--sc);
  background: var(--surface);
}

.pick-card.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.pick-icon {
  font-size: 26px;
  line-height: 1;
}

.pick-name {
  font-size: 11px;
  font-weight: 600;
}

.pick-lock {
  font-size: 10px;
  color: var(--text-3);
}

.plant-confirm {
  width: 100%;
  padding: 11px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}

.visit-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.visit-avatar {
  font-size: 40px;
  line-height: 1;
}

.visit-name {
  font-size: 17px;
  font-weight: 700;
}

.visit-tag {
  font-size: 12px;
  color: var(--text-3);
}

.visit-motto {
  font-size: 13px;
  color: var(--text-2);
  font-style: italic;
  padding: 10px 12px;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  line-height: 1.5;
}

.visit-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.visit-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.visit-stat span {
  font-size: 15px;
  font-weight: 700;
}

.visit-stat small {
  font-size: 10px;
  color: var(--text-3);
}

.visit-garden {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(180deg, #eaf7ef 0%, #f6fbf8 100%);
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
}

.visit-grove {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.visit-plant {
  font-size: 22px;
  line-height: 1;
}

.visit-forest {
  font-size: 12px;
  color: var(--text-2);
}

.visit-desc {
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
  text-align: center;
}

/* toast */
.toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.92);
  color: #fff;
  padding: 10px 20px;
  border-radius: 22px;
  font-size: 13px;
  z-index: 200;
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

@media (max-width: 600px) {
  .level-stats {
    gap: 14px;
  }
  .stat-value {
    font-size: 15px;
  }
  .stage-label {
    display: none;
  }
  .visit-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .action-row {
    flex-direction: column;
  }
}
</style>
