<template>
  <div class="photo-grid-wrapper">
    <!-- View toggle -->
    <div class="view-toggle">
      <button :class="['btn btn-ghost btn-sm', mode === 'grid' && 'active']" @click="mode = 'grid'">Grid</button>
      <button :class="['btn btn-ghost btn-sm', mode === 'slide' && 'active']" @click="startSlideshow">Slideshow</button>
    </div>

    <!-- Grid view -->
    <div v-if="mode === 'grid'" class="grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="grid-item card"
        @click="openItem(item)"
      >
        <div class="thumb">
          <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" :alt="item.title" loading="lazy" />
          <div v-else class="thumb-placeholder">
            <span v-if="item.type === 'video'">▶</span>
            <span v-else-if="item.isPrivate">🔒</span>
            <span v-else>📷</span>
          </div>
          <span v-if="item.type === 'video'" class="video-badge">▶</span>
          <span v-if="item.isPrivate" class="private-overlay">🔒</span>
        </div>
        <div class="item-meta">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-sub text-muted">{{ item.dateDisplay }}</div>
          <div v-if="item.people?.length" class="item-tags">
            <span v-for="p in item.people.slice(0,3)" :key="p" class="badge">{{ p }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Slideshow view -->
    <Slideshow
      v-if="mode === 'slide'"
      :items="items"
      :start-index="slideIndex"
      @close="mode = 'grid'"
    />

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightbox" class="lightbox" @click.self="lightbox = null">
        <button class="lb-close" @click="lightbox = null">✕</button>
        <button class="lb-prev" @click="prevItem">‹</button>
        <button class="lb-next" @click="nextItem">›</button>

        <div class="lb-content">
          <video v-if="lightbox.type === 'video'" :src="lightbox.url" controls class="lb-media" />
          <img   v-else :src="lightbox.url" :alt="lightbox.title" class="lb-media" />
          <div class="lb-meta">
            <h3>{{ lightbox.title }}</h3>
            <p class="text-muted">{{ lightbox.dateDisplay }}</p>
            <p v-if="lightbox.location" class="text-muted">{{ lightbox.location }}</p>
            <p v-if="lightbox.description">{{ lightbox.description }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Slideshow from './Slideshow.vue'

const props = defineProps({
  items: { type: Array, default: () => [] }
})

const mode       = ref('grid')
const lightbox   = ref(null)
const slideIndex = ref(0)

function openItem(item) {
  lightbox.value = item
}

function startSlideshow() {
  slideIndex.value = 0
  mode.value = 'slide'
}

function prevItem() {
  const idx = props.items.indexOf(lightbox.value)
  if (idx > 0) lightbox.value = props.items[idx - 1]
}

function nextItem() {
  const idx = props.items.indexOf(lightbox.value)
  if (idx < props.items.length - 1) lightbox.value = props.items[idx + 1]
}
</script>

<style scoped>
.view-toggle { display: flex; gap: 6px; margin-bottom: 1rem; justify-content: flex-end; }
.btn-sm  { padding: 4px 10px; font-size: 11px; }
.active  { border-color: var(--color-gold) !important; color: var(--color-gold) !important; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.grid-item { cursor: pointer; transition: border-color 0.2s; }
.grid-item:hover { border-color: var(--color-gold-dark); }

.thumb {
  position: relative;
  height: 130px;
  background: var(--color-bg-surface);
  overflow: hidden;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--color-gold-dark);
}
.video-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.7);
  color: var(--color-gold);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 2px;
}
.private-overlay {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 12px;
}

.item-meta   { padding: 8px 10px; }
.item-title  { font-size: 12px; margin-bottom: 2px; }
.item-sub    { font-size: 10px; margin-bottom: 4px; }
.item-tags   { display: flex; gap: 3px; flex-wrap: wrap; }
.badge       { font-size: 9px; }

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lb-close {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: none;
  border: none;
  color: var(--color-gold);
  font-size: 24px;
  cursor: pointer;
}
.lb-prev, .lb-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--color-border-gold);
  color: var(--color-gold);
  font-size: 28px;
  padding: 8px 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.lb-prev { left: 1rem; }
.lb-next { right: 1rem; }

.lb-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
  max-height: 90vh;
  gap: 1rem;
}
.lb-media {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border: 1px solid var(--color-border);
}
.lb-meta { text-align: center; }
.lb-meta h3 { color: var(--color-gold); font-size: 16px; margin-bottom: 4px; }

@media (max-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
