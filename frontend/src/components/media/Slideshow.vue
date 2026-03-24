<template>
  <div class="slideshow" @keydown.left="prev" @keydown.right="next" @keydown.esc="$emit('close')" tabindex="0" ref="el">
    <div class="ss-controls top">
      <button class="btn btn-ghost btn-sm" @click="$emit('close')">✕ Exit</button>
      <div class="ss-info display-font">{{ current.title }}</div>
      <div class="ss-counter text-muted">{{ index + 1 }} / {{ items.length }}</div>
    </div>

    <div class="ss-stage" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <button class="ss-prev" @click="prev">‹</button>
      <Transition name="fade" mode="out-in">
        <div :key="current.id" class="ss-media-wrap">
          <video v-if="current.type === 'video'" :src="current.url" controls class="ss-media" />
          <img   v-else :src="current.url || current.thumbnailUrl" :alt="current.title" class="ss-media" />
        </div>
      </Transition>
      <button class="ss-next" @click="next">›</button>
    </div>

    <!-- Metadata overlay -->
    <div class="ss-meta">
      <div v-if="current.dateDisplay" class="text-muted">{{ current.dateDisplay }}</div>
      <div v-if="current.location"    class="text-muted">{{ current.location }}</div>
      <div v-if="current.description" class="text-muted mt-1">{{ current.description }}</div>
      <div v-if="current.people?.length" class="ss-tags mt-1">
        <span v-for="p in current.people" :key="p" class="badge">{{ p }}</span>
      </div>
    </div>

    <!-- Playback controls -->
    <div class="ss-controls bottom">
      <label class="text-muted">Speed</label>
      <select v-model="speed" class="speed-select">
        <option value="2000">Fast (2s)</option>
        <option value="4000">Normal (4s)</option>
        <option value="7000">Slow (7s)</option>
      </select>
      <button class="btn btn-secondary btn-sm" @click="togglePlay">
        {{ playing ? '⏸ Pause' : '▶ Play' }}
      </button>
      <label class="text-muted">
        <input type="checkbox" v-model="loop" /> Loop
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  items:      { type: Array,  required: true },
  startIndex: { type: Number, default: 0 }
})
const emit = defineEmits(['close'])

const index   = ref(props.startIndex)
const playing = ref(false)
const speed   = ref(4000)
const loop    = ref(true)
const el      = ref(null)
let   timer   = null

const current = computed(() => props.items[index.value] || {})

function next() {
  if (index.value < props.items.length - 1) {
    index.value++
  } else if (loop.value) {
    index.value = 0
  } else {
    stopPlay()
  }
}

function prev() {
  if (index.value > 0) index.value--
}

function togglePlay() {
  playing.value ? stopPlay() : startPlay()
}

function startPlay() {
  playing.value = true
  timer = setInterval(next, Number(speed.value))
}

function stopPlay() {
  playing.value = false
  clearInterval(timer)
}

watch(speed, () => { if (playing.value) { stopPlay(); startPlay() } })

// Touch swipe
let touchX = 0
function onTouchStart(e) { touchX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchX
  if (dx > 50) prev()
  else if (dx < -50) next()
}

onMounted(() => el.value?.focus())
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.slideshow {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 900;
  display: flex;
  flex-direction: column;
  outline: none;
}

.ss-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 10px 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-surface);
}
.ss-controls.bottom {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
}
.ss-info    { flex: 1; font-size: 20px; color: var(--color-gold); }
.ss-counter { font-size: 12px; }

.ss-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.ss-prev, .ss-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--color-border-gold);
  color: var(--color-gold);
  font-size: 32px;
  padding: 10px 16px;
  cursor: pointer;
  z-index: 2;
  border-radius: var(--radius-sm);
}
.ss-prev { left: 1rem; }
.ss-next { right: 1rem; }

.ss-media-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.ss-media {
  max-width: 90%;
  max-height: 100%;
  object-fit: contain;
}

.ss-meta {
  padding: 8px 2rem;
  text-align: center;
  font-size: 13px;
  background: rgba(0,0,0,0.6);
}
.ss-tags { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }

.speed-select {
  width: auto;
  padding: 4px 8px;
  font-size: 12px;
}
.btn-sm { padding: 5px 12px; font-size: 11px; }
</style>
