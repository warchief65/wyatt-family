<template>
  <div class="photos-page">
    <div class="page-header">
      <h1 class="display-font page-title">Photos &amp; Videos</h1>
      <hr class="gold-rule" />
    </div>

    <!-- Filters -->
    <div class="filters">
      <input v-model="filters.q" placeholder="Search photos..." @input="load" class="filter-input" />
      <select v-model="filters.person" @change="load">
        <option value="">All People</option>
        <option v-for="p in people" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="filters.tag" @change="load">
        <option value="">All Tags</option>
        <option v-for="t in tags" :key="t" :value="t">{{ t }}</option>
      </select>
      <input v-model="filters.from" type="number" placeholder="From year" @input="load" class="year-input" />
      <input v-model="filters.to"   type="number" placeholder="To year"   @input="load" class="year-input" />
    </div>

    <div class="photos-content">
      <div v-if="loading" class="loading text-muted">Loading...</div>
      <div v-else-if="!albums.length" class="empty text-muted">No albums found.</div>
      <template v-else>
        <!-- Album grid -->
        <div class="albums-grid">
          <RouterLink
            v-for="album in albums"
            :key="album.id"
            :to="`/photos/${album.id}`"
            class="album-card card"
          >
            <div class="album-thumb">
              <img v-if="album.coverUrl" :src="album.coverUrl" :alt="album.title" />
              <div v-else class="thumb-placeholder">📷</div>
              <span v-if="album.isPrivate" class="badge badge-private album-badge">Private</span>
            </div>
            <div class="album-meta">
              <div class="album-title">{{ album.title }}</div>
              <div class="album-sub text-muted">{{ album.itemCount }} items · {{ album.dateDisplay }}</div>
              <div v-if="album.branch" class="album-branch text-muted">{{ album.branch }}</div>
            </div>
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route  = useRoute()
const albums  = ref([])
const people  = ref([])
const tags    = ref([])
const loading = ref(false)

const filters = ref({ q: route.query.q || '', person: '', tag: '', from: '', to: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/media/albums', { params: filters.value })
    albums.value = data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  load()
  const [pRes, tRes] = await Promise.all([api.get('/people?limit=100'), api.get('/tags')])
  people.value = pRes.data
  tags.value   = tRes.data
})

watch(() => route.query.q, q => { filters.value.q = q || ''; load() })
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.page-title  { font-size: 40px; margin-bottom: 8px; }

.filters {
  display: flex;
  gap: 10px;
  padding: 1.25rem 2rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-border);
}
.filter-input { flex: 2; min-width: 160px; }
.year-input   { width: 100px; }
select        { width: auto; }

.photos-content { padding: 1.5rem 2rem; }

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.album-card { text-decoration: none; color: inherit; transition: border-color 0.2s; }
.album-card:hover { border-color: var(--color-gold-dark); }

.album-thumb {
  position: relative;
  height: 140px;
  background: var(--color-bg-surface);
  overflow: hidden;
}
.album-thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 36px; color: var(--color-gold-dark); }
.album-badge { position: absolute; top: 6px; right: 6px; }

.album-meta   { padding: 10px; }
.album-title  { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
.album-sub    { font-size: 11px; margin-bottom: 2px; }
.album-branch { font-size: 10px; }

.loading, .empty { text-align: center; padding: 3rem; }

@media (max-width: 600px) {
  .albums-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
