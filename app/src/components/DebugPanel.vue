<script setup>
import { ref, computed, watch } from 'vue'
import { useRecordsStore } from '../stores/records.js'
import { TREE_SPECIES, MAX_STAGE, TREE_STAGES, TREE_TOTAL_COST } from '../core/growth.js'

const store = useRecordsStore()
const open = ref(false)
const toast = ref('')

const savedInput = ref(500)
const addXpInput = ref(100)
const addEnergyInput = ref(100)
const addTreesInput = ref(1)

const addSpecies = ref('common')
const addStage = ref(MAX_STAGE)
const addCount = ref(1)

const g = computed(() => store.growth)
const stageNames = TREE_STAGES.map((s) => s.zh)
const stageCosts = TREE_STAGES.map((s) => s.cost).join(' / ')

function flash(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 1600)
}

function syncFromStore() {
  savedInput.value = g.value.totalSaved
}

watch(() => store.loaded, (v) => { if (v) syncFromStore() }, { immediate: true })

async function applySaved() {
  const r = await store.debugSetSaved(savedInput.value)
  syncFromStore()
  flash(`减排 ${savedInput.value} kg → Lv.${store.growthInfo.level} · ${r.treesCompleted} 棵小树`)
}

async function applyAdd() {
  const r = await store.debugAddGrowth({
    xp: addXpInput.value,
    energy: addEnergyInput.value,
    trees: addTreesInput.value,
  })
  flash(`已增加 ${addXpInput.value} XP · ${addEnergyInput.value} 能量 · ${addTreesInput.value} 棵树`)
}

async function applyAddTrees() {
  const r = await store.debugAddTrees(addSpecies.value, addStage.value, addCount.value)
  flash(`已添加 ${addCount.value} 棵 · 共 ${r.total} 棵`)
}

async function plantAll() {
  const r = await store.debugPlantAll()
  flash(`已种满 ${r.count} 个树种`)
}

async function reset() {
  await store.debugResetGrowth()
  syncFromStore()
  flash('成长数据已清空')
}

async function nextDay() {
  const d = await store.debugSetDayOffset(store.dayOffset + 1)
  flash(`已快进到 ${store.todayKey} (第 ${d} 天)`)
}

async function resetDay() {
  await store.debugSetDayOffset(0)
  flash(`已回到今天 ${store.todayKey}`)
}
</script>

<template>
  <div class="dbg">
    <button class="dbg-toggle" :class="{ on: open }" @click="open = !open">
      🧪 测试
    </button>

    <div v-if="open" class="dbg-panel">
      <div class="dbg-head">
        <span>测试面板</span>
        <button class="dbg-x" @click="open = false">✕</button>
      </div>

      <div class="dbg-status">
        Lv.{{ store.growthInfo.level }} · {{ g.xp }} XP · {{ g.energy }} 能量 ·
        {{ g.trees.length }} 棵树 · 小树 {{ store.growthInfo.treesCompleted }}
      </div>

      <div class="dbg-sec">
        <label>时间旅行</label>
        <div class="dbg-row">
          <span class="dbg-k">今天</span>
          <span class="dbg-date">{{ store.todayKey }}</span>
        </div>
        <div class="dbg-row">
          <button class="dbg-go" @click="nextDay">快进到下一天</button>
          <button class="dbg-go" @click="resetDay">回到今天</button>
        </div>
        <div class="dbg-note-inline" v-if="store.dayOffset > 0">
          已快进 {{ store.dayOffset }} 天
        </div>
      </div>

      <div class="dbg-sec">
        <label>按减排量一键生成</label>
        <div class="dbg-row">
          <input v-model.number="savedInput" type="number" min="0" step="10" />
          <span class="dbg-unit">kgCO₂e</span>
          <button class="dbg-go" @click="applySaved">生成</button>
        </div>
        <div class="dbg-quick">
          <button v-for="v in [50, 200, 500, 1000, 2000]" :key="v" @click="savedInput = v; applySaved()">
            {{ v }}
          </button>
        </div>
      </div>

      <div class="dbg-sec">
        <label>一键增加数值</label>
        <div class="dbg-row">
          <span class="dbg-k">XP</span>
          <input v-model.number="addXpInput" type="number" min="0" step="10" />
        </div>
        <div class="dbg-row">
          <span class="dbg-k">能量</span>
          <input v-model.number="addEnergyInput" type="number" min="0" step="10" />
        </div>
        <div class="dbg-row">
          <span class="dbg-k">树的数量</span>
          <input v-model.number="addTreesInput" type="number" min="0" max="60" />
        </div>
        <button class="dbg-go wide" @click="applyAdd">增加</button>
        <div class="dbg-quick">
          <button @click="addXpInput = 100; addEnergyInput = 100; addTreesInput = 0; applyAdd()">+100 XP/能量</button>
          <button @click="addXpInput = 1000; addEnergyInput = 1000; addTreesInput = 0; applyAdd()">+1000 XP/能量</button>
          <button @click="addXpInput = 0; addEnergyInput = 0; addTreesInput = 1; applyAdd()">+1 棵树</button>
          <button @click="addXpInput = 0; addEnergyInput = 0; addTreesInput = 5; applyAdd()">+5 棵树</button>
        </div>
      </div>

      <div class="dbg-sec">
        <label>自定义添加树</label>
        <div class="dbg-row">
          <select v-model="addSpecies">
            <option v-for="s in TREE_SPECIES" :key="s.id" :value="s.id">
              {{ s.icon }} {{ s.zh }}
            </option>
          </select>
        </div>
        <div class="dbg-row">
          <span class="dbg-k">阶段</span>
          <select v-model.number="addStage">
            <option v-for="(n, i) in stageNames" :key="i" :value="i">{{ i }} · {{ n }}</option>
          </select>
        </div>
        <div class="dbg-row">
          <span class="dbg-k">数量</span>
          <input v-model.number="addCount" type="number" min="1" max="60" />
          <button class="dbg-go" @click="applyAddTrees">添加</button>
        </div>
      </div>

      <div class="dbg-sec">
        <button class="dbg-go wide" @click="plantAll">一键种满所有已解锁树种</button>
        <button class="dbg-danger wide" @click="reset">清空成长数据</button>
      </div>

      <div class="dbg-note">
        单棵树满级 {{ TREE_TOTAL_COST }} 能量 · 阶段累计 {{ stageCosts }}
      </div>
    </div>

    <div v-if="toast" class="dbg-toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.dbg {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9000;
  font-size: 13px;
}

.dbg-toggle {
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: #2e7d32;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

.dbg-toggle.on {
  background: #1b5e20;
}

.dbg-panel {
  position: absolute;
  right: 0;
  bottom: 46px;
  width: 268px;
  max-height: 74vh;
  overflow-y: auto;
  padding: 12px;
  border-radius: 14px;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.26);
}

.dbg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  margin-bottom: 8px;
}

.dbg-x {
  border: none;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  color: #6b7280;
}

.dbg-status {
  padding: 7px 9px;
  border-radius: 8px;
  background: #f1f8e9;
  color: #33691e;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.dbg-sec {
  padding-top: 9px;
  margin-top: 9px;
  border-top: 1px solid #eceff1;
}

.dbg-sec:first-of-type {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

.dbg-sec > label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #546e7a;
  margin-bottom: 6px;
}

.dbg-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.dbg-row input,
.dbg-row select {
  flex: 1;
  min-width: 0;
  padding: 5px 7px;
  border: 1px solid #cfd8dc;
  border-radius: 7px;
  font-size: 12px;
  background: #fff;
  color: #1f2937;
}

.dbg-k {
  width: 46px;
  flex: none;
  font-size: 12px;
  color: #607d8b;
}

.dbg-unit {
  font-size: 11px;
  color: #90a4ae;
  flex: none;
}

.dbg-go {
  flex: none;
  padding: 5px 11px;
  border: none;
  border-radius: 7px;
  background: #43a047;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dbg-go.wide {
  width: 100%;
  margin-bottom: 6px;
}

.dbg-danger {
  width: 100%;
  padding: 6px;
  border: 1px solid #ef9a9a;
  border-radius: 7px;
  background: #fff;
  color: #c62828;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dbg-quick {
  display: flex;
  gap: 5px;
}

.dbg-quick button {
  flex: 1;
  padding: 4px 0;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  background: #f1f8e9;
  color: #2e7d32;
  font-size: 11px;
  cursor: pointer;
}

.dbg-note {
  margin-top: 9px;
  font-size: 11px;
  color: #90a4ae;
  line-height: 1.5;
}

.dbg-date {
  font-size: 12px;
  font-weight: 600;
  color: #2e7d32;
  font-variant-numeric: tabular-nums;
}

.dbg-note-inline {
  margin-top: 6px;
  font-size: 11px;
  color: #ef6c00;
}

.dbg-toast {
  position: absolute;
  right: 0;
  bottom: 46px;
  padding: 8px 13px;
  border-radius: 9px;
  background: rgba(27, 94, 32, 0.94);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
}
</style>

<style>
[data-theme='dark'] .dbg-panel {
  background: #1e2a22;
  color: #e8f0e9;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.55);
}

[data-theme='dark'] .dbg-status {
  background: #24352a;
  color: #a5d6a7;
}

[data-theme='dark'] .dbg-sec {
  border-top-color: #2f4034;
}

[data-theme='dark'] .dbg-sec > label,
[data-theme='dark'] .dbg-k {
  color: #90a4ae;
}

[data-theme='dark'] .dbg-row input,
[data-theme='dark'] .dbg-row select {
  background: #16211a;
  border-color: #35473b;
  color: #e8f0e9;
}

[data-theme='dark'] .dbg-quick button {
  background: #24352a;
  border-color: #35473b;
  color: #a5d6a7;
}

[data-theme='dark'] .dbg-danger {
  background: transparent;
  border-color: #7f3a3a;
  color: #ef9a9a;
}

[data-theme='dark'] .dbg-note {
  color: #78909c;
}
</style>
