<template>
  <div class="admin-content">
    <h1 class="display-font admin-title">Content</h1>
    <hr class="gold-rule" />

    <div class="toolbar">
      <div class="filter-tabs">
        <button v-for="t in tabs" :key="t.value"
          :class="['btn btn-ghost btn-sm', filter === t.value && 'active']"
          @click="filter = t.value; load()">
          {{ t.label }}
          <span v-if="t.count" class="tab-count">{{ t.count }}</span>
        </button>
      </div>
      <input v-model="search" placeholder="Search content..." class="search-input" @input="load" />
    </div>

    <div class="content-table">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Private</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.type + c.id">
            <td>{{ c.title }}</td>
            <td><span class="badge">{{ c.type }}</span></td>
            <td>{{ c.isPrivate ? 'Yes' : 'No' }}</td>
            <td class="text-muted">{{ formatDate(c.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!items.length" class="empty text-muted">No content found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const items  = ref([])
const filter = ref('all')
const search = ref('')
const tabs   = ref([
  { label: 'All',       value: 'all',       count: 0 },
  { label: 'Photos',    value: 'photo',     count: 0 },
  { label: 'Documents', value: 'document',  count: 0 },
  { label: 'Stories',   value: 'story',     count: 0 },
])

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  try {
    const all = []

    if (filter.value === 'all' || filter.value === 'photo') {
      const { data } = await api.get('/media/albums')
      const albums = (data.albums || data || []).map(a => ({
        id: a.id, title: a.title, type: 'Photo Album', isPrivate: a.isPrivate, createdAt: a.createdAt
      }))
      all.push(...albums)
    }

    if (filter.value === 'all' || filter.value === 'document') {
      const { data } = await api.get('/documents')
      const docs = (data.documents || data || []).map(d => ({
        id: d.id, title: d.title, type: 'Document', isPrivate: d.isPrivate, createdAt: d.createdAt
      }))
      all.push(...docs)
    }

    if (filter.value === 'all' || filter.value === 'story') {
      const { data } = await api.get('/stories')
      const stories = (data.stories || data || []).map(s => ({
        id: s.id, title: s.title, type: 'Story', isPrivate: s.isPrivate, createdAt: s.createdAt
      }))
      all.push(...stories)
    }

    if (search.value) {
      const q = search.value.toLowerCase()
      items.value = all.filter(c => c.title?.toLowerCase().includes(q))
    } else {
      items.value = all
    }

    tabs.value[0].count = all.length
    tabs.value[1].count = all.filter(c => c.type === 'Photo Album').length
    tabs.value[2].count = all.filter(c => c.type === 'Document').length
    tabs.value[3].count = all.filter(c => c.type === 'Story').length
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.admin-title { font-size: 36px; margin-bottom: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 12px; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 6px; }
.btn-sm { padding: 5px 12px; font-size: 11px; }
.active { border-color: var(--color-gold) !important; color: var(--color-gold) !important; }
.tab-count { background: var(--color-gold); color: #000; font-size: 9px; padding: 1px 5px; border-radius: 8px; margin-left: 4px; }
.search-input { width: 200px; }

.content-table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead th {
  text-align: left;
  padding: 8px 12px;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-gold-dark);
  border-bottom: 1px solid var(--color-border-gold);
}
tbody tr { border-bottom: 1px solid var(--color-border); }
tbody tr:hover { background: var(--color-bg-card); }
tbody td { padding: 10px 12px; }
.empty { text-align: center; padding: 2rem; }
</style>
