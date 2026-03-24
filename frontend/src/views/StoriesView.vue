<template>
  <div class="stories-page">
    <div class="page-header">
      <h1 class="display-font page-title">Stories</h1>
      <hr class="gold-rule" />
    </div>

    <div class="filters">
      <input v-model="filters.q" placeholder="Search stories..." @input="load" class="filter-input" />
      <select v-model="filters.topic" @change="load">
        <option value="">All Topics</option>
        <option v-for="t in topics" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div class="stories-content">
      <div v-if="loading" class="loading text-muted">Loading...</div>
      <div v-else-if="!stories.length" class="empty text-muted">No stories found.</div>
      <div v-else class="stories-grid">
        <RouterLink v-for="s in stories" :key="s.id" :to="`/stories/${s.id}`" class="story-card card">
          <div class="story-header">
            <span v-if="s.topic" class="badge">{{ s.topic }}</span>
            <span v-if="s.isPrivate" class="badge badge-private">Private</span>
          </div>
          <h2 class="story-title">{{ s.title }}</h2>
          <p v-if="s.dateDisplay" class="story-meta text-muted">{{ s.dateDisplay }}</p>
          <p v-if="s.people?.length" class="story-people text-muted">{{ s.people.join(', ') }}</p>
          <p v-if="s.excerpt" class="story-excerpt text-muted">{{ s.excerpt }}</p>
          <span class="read-more">Read story →</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const stories = ref([])
const topics  = ref([])
const loading = ref(false)
const filters = ref({ q: '', topic: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/stories', { params: filters.value })
    stories.value = data
  } finally { loading.value = false }
}

onMounted(async () => {
  load()
  const { data } = await api.get('/tags')
  topics.value = data
})
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.page-title  { font-size: 40px; margin-bottom: 8px; }
.filters { display: flex; gap: 10px; padding: 1.25rem 2rem; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.filter-input { flex: 1; min-width: 200px; }
select { width: auto; }
.stories-content { padding: 1.5rem 2rem; }
.stories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.story-card { padding: 1.25rem; text-decoration: none; color: inherit; transition: border-color 0.2s; }
.story-card:hover { border-color: var(--color-gold-dark); }
.story-header { display: flex; gap: 6px; margin-bottom: 10px; }
.story-title  { font-size: 18px; margin-bottom: 6px; color: var(--color-text); }
.story-meta   { font-size: 12px; margin-bottom: 4px; }
.story-people { font-size: 12px; margin-bottom: 8px; }
.story-excerpt { font-size: 13px; line-height: 1.6; margin-bottom: 12px; }
.read-more { font-size: 12px; color: var(--color-gold-dark); }
.story-card:hover .read-more { color: var(--color-gold); }
.loading, .empty { text-align: center; padding: 3rem; }
</style>
