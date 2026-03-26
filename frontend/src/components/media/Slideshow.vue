<template>
  <div
    ref="el"
    class="slideshow"
    tabindex="0"
    @keydown.esc="$emit('close')"
  >
    <div class="ss-controls top">
      <button
        class="btn btn-ghost btn-sm"
        @click="$emit('close')"
      >
        ✕ Exit
      </button>
      <div class="ss-info display-font">
        {{ currentItem.title }}
      </div>
      <div class="ss-counter text-muted">
        {{ currentSlide + 1 }} / {{ items.length }}
      </div>
    </div>

    <!-- Main carousel -->
    <div
      class="ss-stage"
      :style="{ height: stageHeight + 'px' }"
    >
      <Carousel
        ref="mainCarousel"
        v-model="currentSlide"
        :items-to-show="1"
        :wrap-around="loop"
        :transition="500"
        :autoplay="playing ? Number(speed) : 0"
        :pause-autoplay-on-hover="true"
      >
        <Slide
          v-for="(item, i) in items"
          :key="item.id || i"
        >
          <div class="ss-media-wrap">
            <video
              v-if="item.type === 'video'"
              :src="item.url"
              controls
              class="ss-media"
            />
            <img
              v-else
              :src="item.url || item.thumbnailUrl"
              :alt="item.title"
              class="ss-media"
            >
          </div>
        </Slide>

        <template #addons>
          <Navigation />
        </template>
      </Carousel>
    </div>

    <!-- Metadata overlay -->
    <div class="ss-meta">
      <div
        v-if="currentItem.dateDisplay"
        class="text-muted"
      >
        {{ currentItem.dateDisplay }}
      </div>
      <div
        v-if="currentItem.location"
        class="text-muted"
      >
        {{ currentItem.location }}
      </div>
      <div
        v-if="currentItem.description"
        class="text-muted mt-1"
      >
        {{ currentItem.description }}
      </div>
      <div
        v-if="currentItem.people?.length"
        class="ss-tags mt-1"
      >
        <span
          v-for="p in currentItem.people"
          :key="p"
          class="badge"
        >{{ p }}</span>
      </div>
    </div>

    <!-- Thumbnail gallery carousel -->
    <div class="ss-thumbs">
      <Carousel
        ref="thumbCarousel"
        v-model="currentSlide"
        :items-to-show="thumbCount"
        :wrap-around="false"
        :gap="8"
      >
        <Slide
          v-for="(item, i) in items"
          :key="'t-' + (item.id || i)"
        >
          <div
            class="thumb-item"
            :class="{ active: currentSlide === i }"
            @click="currentSlide = i"
          >
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              :alt="item.title"
            >
            <div
              v-else
              class="thumb-placeholder"
            >
              <span v-if="item.type === 'video'">▶</span>
              <span v-else>📷</span>
            </div>
          </div>
        </Slide>
      </Carousel>
    </div>

    <!-- Playback controls -->
    <div class="ss-controls bottom">
      <label class="text-muted">Speed</label>
      <select
        v-model="speed"
        class="speed-select"
      >
        <option value="2000">
          Fast (2s)
        </option>
        <option value="4000">
          Normal (4s)
        </option>
        <option value="7000">
          Slow (7s)
        </option>
      </select>
      <button
        class="btn btn-secondary btn-sm"
        @click="playing = !playing"
      >
        {{ playing ? '⏸ Pause' : '▶ Play' }}
      </button>
      <label class="text-muted">
        <input
          v-model="loop"
          type="checkbox"
        > Loop
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { Carousel, Slide, Navigation } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'

const props = defineProps({
  items:      { type: Array,  required: true },
  startIndex: { type: Number, default: 0 }
})
defineEmits(['close'])

const currentSlide  = ref(props.startIndex)
const playing       = ref(false)
const speed         = ref(4000)
const loop          = ref(true)
const el            = ref(null)
const mainCarousel  = ref(null)
const thumbCarousel = ref(null)

const { height: winH } = useWindowSize()
// Reserve: top bar(42) + meta(40) + thumb strip(104) + bottom bar(42) + breathing room(12) = 240
const stageHeight = computed(() => Math.max(200, winH.value - 240))

const thumbCount = computed(() => Math.min(props.items.length, 8))
const currentItem = computed(() => props.items[currentSlide.value] || {})

onMounted(() => el.value?.focus())
</script>

<style scoped>
.slideshow {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 900;
  display: flex;
  flex-direction: column;
  height: 100vh;
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
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.ss-stage :deep(.carousel) {
  width: 100% !important;
  height: 100% !important;
}
.ss-stage :deep(.carousel__viewport) {
  height: 100% !important;
}
.ss-stage :deep(.carousel__track) {
  height: 100% !important;
}
.ss-stage :deep(.carousel__slide) {
  height: 100% !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Navigation arrows */
.ss-stage :deep(.carousel__prev),
.ss-stage :deep(.carousel__next) {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border-gold);
  color: var(--color-gold);
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
}
.ss-stage :deep(.carousel__prev:hover),
.ss-stage :deep(.carousel__next:hover) {
  background: rgba(0, 0, 0, 0.7);
}

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
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.ss-meta {
  padding: 8px 2rem;
  text-align: center;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.6);
}
.ss-tags { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }

/* Thumbnail gallery strip */
.ss-thumbs {
  padding: 10px 2rem;
  background: var(--color-bg-surface);
  border-top: 1px solid var(--color-border);
}
.ss-thumbs :deep(.carousel__slide) {
  padding: 0 4px;
}
.thumb-item {
  width: 100%;
  height: 150px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  opacity: 0.5;
  transition: opacity 0.2s, border-color 0.2s;
}
.thumb-item.active {
  border-color: var(--color-gold);
  opacity: 1;
}
.thumb-item:hover {
  opacity: 0.85;
}
.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--color-text-faint);
  background: var(--color-bg);
}

.speed-select {
  width: auto;
  padding: 4px 8px;
  font-size: 12px;
}
.btn-sm { padding: 5px 12px; font-size: 11px; }
</style>
