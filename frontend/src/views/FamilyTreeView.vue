<template>
  <div class="tree-page">
    <div class="page-header">
      <h1 class="display-font page-title">
        Family Tree
      </h1>
      <p class="text-muted page-sub">
        The Wyatt family lineage from Kent, England to America
      </p>
      <hr class="gold-rule">
    </div>

    <div class="tree-toolbar">
      <input
        v-model="search"
        placeholder="Search family members..."
        class="search-input"
        @input="filterPeople"
      >
      <div class="tree-controls">
        <button
          class="btn btn-ghost btn-sm"
          @click="zoom(0.1)"
        >
          ＋ Zoom
        </button>
        <button
          class="btn btn-ghost btn-sm"
          @click="zoom(-0.1)"
        >
          － Zoom
        </button>
        <button
          class="btn btn-ghost btn-sm"
          @click="resetView"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Person detail panel -->
    <div class="tree-layout">
      <div
        ref="canvasWrap"
        class="tree-canvas-wrap"
      >
        <div
          ref="canvas"
          class="tree-canvas"
          :style="canvasStyle"
        >
          <svg
            :width="svgWidth"
            :height="svgHeight"
            class="tree-svg"
          >
            <!-- Connector lines -->
            <line
              v-for="line in lines"
              :key="line.id"
              :x1="line.x1"
              :y1="line.y1"
              :x2="line.x2"
              :y2="line.y2"
              stroke="#7A6020"
              stroke-width="1"
            />
          </svg>

          <!-- Person nodes -->
          <div
            v-for="node in nodes"
            :key="node.id"
            class="person-node"
            :class="{ selected: selectedId === node.id, private: node.isPrivate }"
            :style="{ left: node.x + 'px', top: node.y + 'px' }"
            @click="selectPerson(node)"
          >
            <div class="node-avatar">
              <img
                v-if="node.thumbnailUrl"
                :src="node.thumbnailUrl"
                :alt="node.displayName"
              >
              <span
                v-else
                class="avatar-initials"
              >{{ initials(node.displayName) }}</span>
            </div>
            <div class="node-name">
              {{ node.displayName }}
            </div>
            <div
              v-if="!node.isPrivate || auth.isLoggedIn"
              class="node-dates text-muted"
            >
              {{ node.birthDate ? node.birthDate.substring(0,4) : '?' }}
              {{ node.deathDate ? '– ' + node.deathDate.substring(0,4) : '' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Side panel -->
      <Transition name="fade">
        <div
          v-if="selected"
          class="person-panel card"
        >
          <button
            class="panel-close"
            @click="selected = null; selectedId = null"
          >
            ✕
          </button>
          <div class="panel-avatar">
            <img
              v-if="selected.thumbnailUrl"
              :src="selected.thumbnailUrl"
            >
            <div
              v-else
              class="avatar-large"
            >
              {{ initials(selected.firstName + ' ' + selected.lastName) }}
            </div>
          </div>
          <h2 class="panel-name display-font">
            {{ selected.firstName }} {{ selected.lastName }}
          </h2>
          <div
            v-if="selected.birthDate || selected.deathDate"
            class="panel-dates text-muted"
          >
            {{ selected.birthDate || '?' }} {{ selected.deathDate ? '– ' + selected.deathDate : '' }}
          </div>
          <div
            v-if="selected.birthPlace"
            class="panel-place text-muted"
          >
            {{ selected.birthPlace }}
          </div>
          <hr class="gold-rule">
          <p
            v-if="selected.bio"
            class="panel-bio text-muted"
          >
            {{ selected.bio }}
          </p>
          <div
            v-if="selected.fatherName || selected.motherName"
            class="panel-parents"
          >
            <div
              v-if="selected.fatherName"
              class="text-muted"
            >
              Father: <span class="text-gold">{{ selected.fatherName }}</span>
            </div>
            <div
              v-if="selected.motherName"
              class="text-muted"
            >
              Mother: <span class="text-gold">{{ selected.motherName }}</span>
            </div>
          </div>
          <div
            v-if="selected.mediaCount || selected.docCount || selected.storyCount"
            class="panel-counts"
          >
            <RouterLink
              v-if="selected.mediaCount"
              :to="`/photos?person=${selected.id}`"
              class="count-chip"
            >
              📷 {{ selected.mediaCount }} photos
            </RouterLink>
            <RouterLink
              v-if="selected.docCount"
              :to="`/documents?person=${selected.id}`"
              class="count-chip"
            >
              📄 {{ selected.docCount }} documents
            </RouterLink>
            <RouterLink
              v-if="selected.storyCount"
              :to="`/stories?person=${selected.id}`"
              class="count-chip"
            >
              📖 {{ selected.storyCount }} stories
            </RouterLink>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const auth  = useAuthStore()

const allPeople  = ref([])
const nodes      = ref([])
const lines      = ref([])
const selected   = ref(null)
const selectedId = ref(null)
const search     = ref('')
const scale      = ref(1)
const svgWidth   = ref(2000)
const svgHeight  = ref(1500)

const canvasStyle = computed(() => ({ transform: `scale(${scale.value})`, transformOrigin: '0 0' }))

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function zoom(delta) { scale.value = Math.max(0.3, Math.min(2, scale.value + delta)) }
function resetView()  { scale.value = 1 }

function filterPeople() {
  const q = search.value.toLowerCase()
  nodes.value = layoutNodes(allPeople.value.filter(p =>
    !q || p.displayName.toLowerCase().includes(q)
  ))
}

function layoutNodes(people) {
  // Simple generational layout — group by generation depth
  const nodeSize = { w: 130, h: 80 }
  const gap      = { x: 20, y: 120 }
  const placed   = new Map()

  // Determine generation — root nodes (no parents in set) = gen 0
  const ids = new Set(people.map(p => p.id))
  function getGen(p, memo = new Map()) {
    if (memo.has(p.id)) return memo.get(p.id)
    const hasFather = p.fatherId && ids.has(p.fatherId)
    const hasMother = p.motherId && ids.has(p.motherId)
    if (!hasFather && !hasMother) { memo.set(p.id, 0); return 0 }
    const fatherGen = hasFather ? getGen(people.find(x => x.id === p.fatherId), memo) : -1
    const motherGen = hasMother ? getGen(people.find(x => x.id === p.motherId), memo) : -1
    const g = Math.max(fatherGen, motherGen) + 1
    memo.set(p.id, g); return g
  }

  const genMap = new Map()
  people.forEach(p => {
    const g = getGen(p)
    if (!genMap.has(g)) genMap.set(g, [])
    genMap.get(g).push(p)
  })

  const result = []
  genMap.forEach((members, gen) => {
    members.forEach((p, i) => {
      const x = i * (nodeSize.w + gap.x) + 20
      const y = gen * (nodeSize.h + gap.y) + 20
      placed.set(p.id, { x, y })
      result.push({ ...p, x, y })
    })
  })
  svgWidth.value  = Math.max(2000, result.reduce((m, n) => Math.max(m, n.x + 200), 0))
  svgHeight.value = Math.max(1500, result.reduce((m, n) => Math.max(m, n.y + 200), 0))
  return result
}

function buildLines(nodes) {
  const lines = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  nodes.forEach(n => {
    if (n.fatherId && nodeMap.has(n.fatherId)) {
      const f = nodeMap.get(n.fatherId)
      lines.push({ id: `f${n.id}`, x1: f.x + 65, y1: f.y + 80, x2: n.x + 65, y2: n.y })
    }
    if (n.motherId && nodeMap.has(n.motherId)) {
      const m = nodeMap.get(n.motherId)
      lines.push({ id: `m${n.id}`, x1: m.x + 65, y1: m.y + 80, x2: n.x + 65, y2: n.y })
    }
  })
  return lines
}

async function selectPerson(node) {
  selectedId.value = node.id
  const { data } = await api.get(`/people/${node.id}`)
  selected.value = data
}

onMounted(async () => {
  const { data } = await api.get('/people/tree')
  allPeople.value = data
  nodes.value  = layoutNodes(data)
  lines.value  = buildLines(nodes.value)

  // Open person from query param
  if (route.query.person) {
    const node = nodes.value.find(n => n.id === Number(route.query.person))
    if (node) selectPerson(node)
  }
})
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.page-title  { font-size: 40px; margin-bottom: 6px; }
.page-sub    { font-size: 13px; margin-bottom: 0; }

.tree-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid var(--color-border); gap: 12px; }
.search-input { width: 260px; }
.tree-controls { display: flex; gap: 8px; }
.btn-sm { padding: 5px 12px; font-size: 11px; }

.tree-layout { display: flex; height: calc(100vh - 220px); }
.tree-canvas-wrap { flex: 1; overflow: auto; position: relative; background: var(--color-bg); cursor: grab; }
.tree-canvas { position: relative; }
.tree-svg { position: absolute; top: 0; left: 0; pointer-events: none; }

.person-node {
  position: absolute;
  width: 130px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.1s;
  user-select: none;
}
.person-node:hover   { border-color: var(--color-gold-dark); }
.person-node.selected{ border-color: var(--color-gold); box-shadow: 0 0 0 2px rgba(201,168,76,0.2); }
.person-node.private { opacity: 0.6; }

.node-avatar  { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; margin: 0 auto 6px; background: var(--color-gold-deep); display: flex; align-items: center; justify-content: center; }
.node-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { font-size: 14px; color: var(--color-gold); font-weight: 500; }
.node-name  { font-size: 11px; font-weight: 500; line-height: 1.3; }
.node-dates { font-size: 10px; }

.person-panel { width: 280px; flex-shrink: 0; padding: 1.25rem; overflow-y: auto; position: relative; border-left: 1px solid var(--color-border-gold); border-radius: 0; }
.panel-close  { position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 16px; }
.panel-avatar { width: 70px; height: 70px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px; background: var(--color-gold-deep); display: flex; align-items: center; justify-content: center; }
.panel-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-large { font-size: 24px; color: var(--color-gold); font-weight: 500; }
.panel-name   { font-size: 24px; text-align: center; margin-bottom: 4px; }
.panel-dates, .panel-place { font-size: 12px; text-align: center; margin-bottom: 2px; }
.panel-bio    { font-size: 13px; line-height: 1.6; margin-bottom: 1rem; }
.panel-parents { font-size: 12px; margin-bottom: 1rem; }
.panel-counts  { display: flex; flex-direction: column; gap: 6px; }
.count-chip {
  background: var(--color-gold-subtle);
  color: var(--color-gold);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  text-decoration: none;
}
.count-chip:hover { background: var(--color-gold-deep); }
</style>
