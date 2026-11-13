<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TREE_SPECIES, MAX_STAGE, TREE_STAGES } from '../core/growth.js'

const props = defineProps({
  trees: { type: Array, default: () => [] },
  gridSize: { type: Number, default: 6 },
  interactive: { type: Boolean, default: true },
  selectedId: { type: String, default: null },
  height: { type: String, default: '420px' }
})
const emit = defineEmits(['pick'])

const host = ref(null)
const hoverName = ref('')
const ready = ref(false)

let renderer, scene, camera, controls, raycaster, pointer
let raf = 0
let ro = null
let disposed = false
const treeGroup = shallowRef(null)
const pickables = []
let elapsed = 0
let lastTime = 0

const SPECIES_STYLE = {
  common: { trunk: 0x9a6b4f, crown: 0x5fbf5f, crown2: 0x7ed07e, fruit: null, shape: 'round' },
  apple: { trunk: 0x9a6b4f, crown: 0x4fb04f, crown2: 0x6ec96e, fruit: 0xf2453d, shape: 'apple' },
  orange: { trunk: 0x9a6b4f, crown: 0x2f9e3f, crown2: 0x4cbb55, fruit: 0xff9f1c, shape: 'orange' },
  cherry: { trunk: 0x8a5a44, crown: 0xf7a8c4, crown2: 0xffc4d8, fruit: 0xe8366f, shape: 'cloud' },
  peach: { trunk: 0x9a6b4f, crown: 0x7fc94a, crown2: 0xf7b8c8, fruit: 0xff8f7a, shape: 'heart' },
  bamboo: { trunk: 0xb8d96a, crown: 0x7cc93f, crown2: 0xa8dd6e, fruit: null, shape: 'bamboo' },
  maple: { trunk: 0x8a5a44, crown: 0xe8622a, crown2: 0xf59a3c, fruit: null, shape: 'umbrella' },
  pine: { trunk: 0x7a5240, crown: 0x2b8a3e, crown2: 0x3da34f, fruit: null, shape: 'cone' }
}

function styleOf(id) {
  return SPECIES_STYLE[id] || SPECIES_STYLE.common
}

function growthRatio(tr) {
  const stage = Math.min(tr.stage || 0, MAX_STAGE)
  const base = TREE_STAGES[stage] || 0
  const next = TREE_STAGES[Math.min(stage + 1, MAX_STAGE)] || base
  const span = next - base
  const p = span > 0 ? Math.min(Math.max((tr.progress || 0) / span, 0), 1) : 0
  return Math.min((stage + p) / MAX_STAGE, 1)
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.02,
    flatShading: true,
    ...opts
  })
}

function addSelectRing(g, inv = 1) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.72, 32),
    new THREE.MeshBasicMaterial({ color: 0xffca28, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.14 * inv
  ring.scale.setScalar(inv)
  ring.renderOrder = 2
  g.add(ring)
}

function buildTree(tr) {
  const g = new THREE.Group()
  const st = styleOf(tr.speciesId)
  const r = growthRatio(tr)
  const scale = 0.42 + r * 0.34
  const trunkH = 0.55 + r * 0.55
  const trunkR = 0.13 + r * 0.07

  // 种子阶段: 刚破土的小苗 (细茎 + 两片嫩叶)
  if ((tr.stage || 0) === 0) {
    const stemH = 0.5
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, stemH, 6), mat(0x8bc34a))
    stem.position.y = stemH / 2
    g.add(stem)

    const leafGeo = new THREE.SphereGeometry(0.2, 8, 6)
    for (const dir of [-1, 1]) {
      const leaf = new THREE.Mesh(leafGeo, mat(dir < 0 ? st.crown : st.crown2))
      leaf.position.set(dir * 0.17, stemH * 0.92, 0)
      leaf.scale.set(1.15, 0.42, 0.72)
      leaf.rotation.z = dir * 0.5
      g.add(leaf)
    }

    const bud = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), mat(st.crown2))
    bud.position.y = stemH + 0.05
    g.add(bud)

    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.1, 10), mat(0x8d6e63, { roughness: 1 }))
    soil.position.y = 0.05
    g.add(soil)

    g.scale.setScalar(0.85)
    return g
  }

  if (st.shape === 'bamboo') {
    const n = 5 + Math.round(r * 3)
    for (let i = 0; i < n; i++) {
      const h = trunkH * (0.95 + (i % 3) * 0.26)
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.095, h, 6), mat(st.trunk))
      const a = (i / n) * Math.PI * 2
      const px = Math.cos(a) * 0.2
      const pz = Math.sin(a) * 0.2
      stalk.position.set(px, h / 2, pz)
      g.add(stalk)

      // 竹节
      const node = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 6), mat(0x8fbf4a))
      node.position.set(px, h * 0.62, pz)
      g.add(node)

      // 顶部竹叶簇: 几片细长叶向外斜伸
      const leafN = 5
      for (let k = 0; k < leafN; k++) {
        const la = a + (k / leafN) * Math.PI * 2
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.3 + r * 0.16, 6, 4),
          mat(k % 2 ? st.crown : st.crown2)
        )
        leaf.position.set(px + Math.cos(la) * 0.3, h * (0.86 + (k % 2) * 0.1), pz + Math.sin(la) * 0.3)
        leaf.scale.set(1.7, 0.22, 0.42)
        leaf.rotation.y = -la
        leaf.rotation.z = 0.5
        g.add(leaf)
      }
    }
    g.scale.setScalar(scale * 1.15)
    return g
  }

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkR * 0.72, trunkR * 1.15, trunkH, 8), mat(st.trunk))
  trunk.position.y = trunkH / 2
  g.add(trunk)

  const crownY = trunkH
  const rad = 0.5 + r * 0.5

  if (st.shape === 'cone') {
    // 松树: 圆锥叠加, 上小下大, 底层贴住树干顶
    const layers = 3 + Math.round(r * 2)
    const ch = 0.62 + r * 0.42
    for (let i = 0; i < layers; i++) {
      const t = i / layers
      const cr = (0.9 - t * 0.62) * (0.5 + r * 0.7)
      const cone = new THREE.Mesh(new THREE.ConeGeometry(cr, ch, 8), mat(i % 2 ? st.crown : st.crown2))
      cone.position.y = trunkH + t * (0.5 + r * 0.55) + ch / 2
      g.add(cone)
    }
  } else if (st.shape === 'cloud') {
    // 樱花树: 蓬松云朵状, 多球柔和堆叠
    const puffs = [
      [0, 0.95, 0, 1.0],
      [-0.42, 0.72, 0.18, 0.72],
      [0.44, 0.78, -0.14, 0.76],
      [0.1, 1.28, 0.3, 0.66],
      [-0.2, 1.22, -0.34, 0.62],
      [0.34, 0.5, 0.36, 0.6],
      [-0.36, 0.52, -0.3, 0.58]
    ]
    puffs.forEach((p, i) => {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(rad * p[3], 1),
        mat(i % 2 ? st.crown2 : st.crown)
      )
      puff.position.set(p[0] * rad, crownY + p[1] * rad, p[2] * rad)
      puff.scale.set(1, 0.86, 1)
      g.add(puff)
    })
  } else if (st.shape === 'heart') {
    // 桃树: 上宽下尖的水滴形, 顶部两瓣微凹
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 1.0, 1), mat(st.crown))
    top.position.y = crownY + rad * 1.05
    top.scale.set(1.25, 0.72, 1.25)
    g.add(top)
    const lobeL = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.62, 1), mat(st.crown2))
    lobeL.position.set(-rad * 0.42, crownY + rad * 1.42, 0)
    lobeL.scale.set(1, 0.9, 1)
    g.add(lobeL)
    const lobeR = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.62, 1), mat(st.crown2))
    lobeR.position.set(rad * 0.42, crownY + rad * 1.42, 0)
    lobeR.scale.set(1, 0.9, 1)
    g.add(lobeR)
    const mid = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.78, 1), mat(st.crown))
    mid.position.y = crownY + rad * 0.62
    mid.scale.set(1.05, 0.8, 1.05)
    g.add(mid)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.6, rad * 0.9, 8), mat(st.crown2))
    tip.position.y = crownY + rad * 0.2
    tip.rotation.x = Math.PI
    g.add(tip)
    if (r > 0.4) {
      const n = Math.round(4 + r * 6)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.5
        const fruit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 + r * 0.05, 1), mat(st.fruit, { roughness: 0.42 }))
        fruit.position.set(
          Math.cos(a) * rad * 0.92,
          crownY + rad * (0.55 + (i % 3) * 0.32),
          Math.sin(a) * rad * 0.92
        )
        g.add(fruit)
      }
    }
  } else if (st.shape === 'umbrella') {
    // 枫树: 层叠伞盖, 上小下大, 边缘外扩
    const tiers = [
      { y: 0.42, r: 1.2, sy: 0.38, c: st.crown },
      { y: 0.92, r: 0.95, sy: 0.4, c: st.crown2 },
      { y: 1.42, r: 0.62, sy: 0.46, c: st.crown }
    ]
    tiers.forEach((t) => {
      const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * t.r, 1), mat(t.c))
      cap.position.y = crownY + rad * t.y
      cap.scale.set(1.25, t.sy, 1.25)
      g.add(cap)
    })
    // 外扩叶簇, 强化伞形轮廓
    const n = 6
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3
      const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.4, 1), mat(i % 2 ? st.crown2 : st.crown))
      tuft.position.set(Math.cos(a) * rad * 1.2, crownY + rad * (0.42 + (i % 2) * 0.2), Math.sin(a) * rad * 1.2)
      tuft.scale.set(1.15, 0.5, 1.15)
      g.add(tuft)
    }
  } else if (st.shape === 'apple' || st.shape === 'orange') {
    // 苹果树/橘子树: 圆润饱满的球, 果实明显
    const main = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), mat(st.crown))
    main.position.y = crownY + rad * 0.88
    main.scale.set(1.08, 0.98, 1.08)
    g.add(main)
    const side = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.62, 1), mat(st.crown2))
    side.position.set(rad * 0.5, crownY + rad * 0.6, rad * 0.3)
    g.add(side)
    const side2 = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.55, 1), mat(st.crown2))
    side2.position.set(-rad * 0.48, crownY + rad * 0.66, -rad * 0.28)
    g.add(side2)
    if (r > 0.45) {
      const n = Math.round(4 + r * 7)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.6
        const yy = crownY + rad * (0.5 + ((i * 41) % 100) / 100 * 0.95)
        const fruit = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.15 + r * 0.06, 1),
          mat(st.fruit, { roughness: 0.42 })
        )
        fruit.position.set(Math.cos(a) * rad * 0.88, yy, Math.sin(a) * rad * 0.88)
        g.add(fruit)
      }
    }
  } else {
    // 普通树: 经典圆润球体
    const main = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), mat(st.crown))
    main.position.y = crownY + rad * 0.85
    main.scale.set(1.02, 0.94, 1.02)
    g.add(main)
    const lobe = new THREE.Mesh(new THREE.IcosahedronGeometry(rad * 0.58, 1), mat(st.crown2))
    lobe.position.set(rad * 0.42, crownY + rad * 1.15, -rad * 0.3)
    g.add(lobe)
  }

  g.scale.setScalar(scale)

  return g
}

function buildGround(size) {
  const g = new THREE.Group()
  const cell = 1.5
  const half = (size * cell) / 2
  const soilA = mat(0x9ccc65, { roughness: 1 })
  const soilB = mat(0x8bc34a, { roughness: 1 })
  const soilEmpty = mat(0xd7ccc8, { roughness: 1 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(size * cell + 0.5, 0.3, size * cell + 0.5), mat(0x7cb342, { roughness: 1 }))
  base.position.y = -0.16
  g.add(base)

  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(cell - 0.08, 0.12, cell - 0.08), (x + z) % 2 ? soilA : soilB)
      tile.position.set(-half + cell / 2 + x * cell, 0.06, -half + cell / 2 + z * cell)
      g.add(tile)
    }
  }
  return { group: g, cell, half, soilEmpty }
}

function cellPos(index, size, cell, half) {
  const x = index % size
  const z = Math.floor(index / size)
  return new THREE.Vector3(-half + cell / 2 + x * cell, 0.12, -half + cell / 2 + z * cell)
}

/** 把树均匀散布到整个果园, 避免全挤在一角 */
function scatterSlots(count, size) {
  const total = size * size
  if (count >= total) return Array.from({ length: total }, (_, i) => i)
  const slots = []
  const used = new Set()
  // 黄金角螺旋给出理想位置, 再贪心挑「离已选格子最远」的空格, 保证间距
  const golden = Math.PI * (3 - Math.sqrt(5))
  const ideal = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const r = Math.sqrt(t) * 0.98
    const a = i * golden
    ideal.push([
      (0.5 + Math.cos(a) * r) * (size - 1),
      (0.5 + Math.sin(a) * r) * (size - 1)
    ])
  }
  for (let i = 0; i < count; i++) {
    const [ix, iz] = ideal[i]
    let best = -1
    let bestScore = -Infinity
    for (let idx = 0; idx < total; idx++) {
      if (used.has(idx)) continue
      const cx = idx % size
      const cz = Math.floor(idx / size)
      let score = -Math.hypot(cx - ix, cz - iz)
      // 与已占用格子的距离也计入, 避免扎堆
      for (const u of used) {
        const ux = u % size
        const uz = Math.floor(u / size)
        score += Math.min(Math.hypot(cx - ux, cz - uz), 2.2) * 0.9
      }
      if (score > bestScore) {
        bestScore = score
        best = idx
      }
    }
    if (best < 0) best = 0
    used.add(best)
    slots.push(best)
  }
  return slots
}

function disposeGroup(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
      else o.material.dispose()
    }
  })
}

function rebuild() {
  if (!scene) return
  if (treeGroup.value) {
    scene.remove(treeGroup.value)
    disposeGroup(treeGroup.value)
  }
  pickables.length = 0

  const size = props.gridSize
  const { group: ground, cell, half } = buildGround(size)
  const root = new THREE.Group()
  root.add(ground)

  const list = (props.trees || []).slice(0, size * size)
  const slots = scatterSlots(list.length, size)
  list.forEach((tr, i) => {
    const node = buildTree(tr)
    const p = cellPos(slots[i], size, cell, half)
    node.position.copy(p)
    node.userData.tree = tr
    node.userData.baseY = p.y
    node.userData.phase = (i * 1.7) % (Math.PI * 2)
    if (props.selectedId && tr.id === props.selectedId) {
      addSelectRing(node, 1 / (node.scale.x || 1))
    }
    root.add(node)
    if (props.interactive) pickables.push(node)
  })

  treeGroup.value = root
  scene.add(root)
}

function init() {
  const el = host.value
  if (!el) return
  const w = el.clientWidth || 600
  const h = el.clientHeight || 420

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xdff3e4)
  scene.fog = new THREE.Fog(0xdff3e4, 14, 30)

  camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200)
  camera.position.set(0, 13.5, 12.5)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  el.appendChild(renderer.domElement)

  const hemi = new THREE.HemisphereLight(0xffffff, 0x9ccc65, 1.05)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xffffff, 1.5)
  dir.position.set(6, 12, 7)
  dir.castShadow = true
  dir.shadow.mapSize.set(1024, 1024)
  dir.shadow.camera.left = -10
  dir.shadow.camera.right = 10
  dir.shadow.camera.top = 10
  dir.shadow.camera.bottom = -10
  scene.add(dir)
  scene.add(new THREE.AmbientLight(0xffffff, 0.35))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 8
  controls.maxDistance = 30
  controls.maxPolarAngle = Math.PI * 0.42
  controls.target.set(0, 0.3, 0)
  controls.enablePan = false

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  rebuild()
  ready.value = true

  const loop = (now) => {
    if (disposed) return
    raf = requestAnimationFrame(loop)
    const t = now ? now / 1000 : (elapsed += 0.016)
    elapsed = t
    if (treeGroup.value) {
      treeGroup.value.children.forEach((c) => {
        if (c.userData.tree) {
          c.position.y = c.userData.baseY + Math.sin(t * 1.4 + c.userData.phase) * 0.035
          c.rotation.z = Math.sin(t * 0.9 + c.userData.phase) * 0.012
        }
      })
    }
    controls.update()
    renderer.render(scene, camera)
  }
  loop()

  ro = new ResizeObserver(() => {
    if (!renderer || !host.value) return
    const nw = host.value.clientWidth || w
    const nh = host.value.clientHeight || h
    camera.aspect = nw / nh
    camera.updateProjectionMatrix()
    renderer.setSize(nw, nh)
  })
  ro.observe(el)

  renderer.domElement.addEventListener('pointermove', onMove)
  renderer.domElement.addEventListener('click', onClick)
}

function pickAt(ev) {
  if (!renderer || !pickables.length) return null
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(pickables, true)
  if (!hits.length) return null
  let o = hits[0].object
  while (o && !o.userData.tree) o = o.parent
  return o
}

function onMove(ev) {
  const node = pickAt(ev)
  if (node) {
    hoverName.value = node.userData.tree?.name || ''
    renderer.domElement.style.cursor = 'pointer'
  } else {
    hoverName.value = ''
    renderer.domElement.style.cursor = 'grab'
  }
}

function onClick(ev) {
  const node = pickAt(ev)
  if (node) emit('pick', node.userData.tree)
}

onMounted(() => {
  nextTick(init)
})

onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(raf)
  if (ro) ro.disconnect()
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', onMove)
    renderer.domElement.removeEventListener('click', onClick)
    if (treeGroup.value) disposeGroup(treeGroup.value)
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  if (controls) controls.dispose()
})

watch(
  () => [props.trees, props.gridSize, props.selectedId],
  () => {
    if (ready.value) rebuild()
  },
  { deep: true }
)

defineExpose({ rebuild })
</script>

<template>
  <div class="orchard-wrap" :style="{ height }">
    <div ref="host" class="orchard-canvas"></div>
    <div v-if="hoverName" class="orchard-tip">{{ hoverName }}</div>
    <div v-if="!trees.length" class="orchard-empty">
      <slot name="empty">🌱</slot>
    </div>
  </div>
</template>

<style scoped>
.orchard-wrap {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, #dff3e4 0%, #eef9f1 100%);
}
.orchard-canvas {
  width: 100%;
  height: 100%;
}
.orchard-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
.orchard-tip {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #2e7d32;
  font-size: 12px;
  font-weight: 600;
  pointer-events: none;
}
.orchard-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  opacity: 0.5;
  pointer-events: none;
}
</style>
