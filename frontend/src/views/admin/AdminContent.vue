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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="c in items" :key="c.type + c.id">
            <tr :class="{ 'row-expandable': c.type === 'Photo Album', 'row-expanded': expandedAlbum?.id === c.id }">
              <td>
                <button v-if="c.type === 'Photo Album'" class="expand-btn" @click="toggleAlbum(c)">
                  {{ expandedAlbum?.id === c.id ? '▾' : '▸' }}
                </button>
                <span v-if="c.type === 'Photo'" class="photo-inline">
                  <img v-if="c.thumbnailUrl" :src="c.thumbnailUrl" class="inline-thumb" />
                  <span v-else class="inline-thumb-placeholder">{{ c.mediaType === 'video' ? '▶' : '📷' }}</span>
                </span>
                <span :class="{ 'album-link': c.type === 'Photo Album' }" @click="c.type === 'Photo Album' && toggleAlbum(c)">
                  {{ c.title }}
                </span>
                <span v-if="c.type === 'Photo Album' && c.itemCount" class="item-count text-muted">({{ c.itemCount }} items)</span>
                <span v-if="c.albumTitle" class="item-count text-muted">in {{ c.albumTitle }}</span>
              </td>
              <td><span class="badge">{{ c.type }}</span></td>
              <td>{{ c.isPrivate ? 'Yes' : 'No' }}</td>
              <td class="text-muted">{{ formatDate(c.createdAt) }}</td>
              <td>
                <button class="btn btn-danger btn-sm" @click="deleteItem(c)" :disabled="deleting">
                  {{ deleting === c ? 'Deleting...' : 'Delete' }}
                </button>
              </td>
            </tr>
            <!-- Expanded album items -->
            <tr v-if="expandedAlbum?.id === c.id && albumItems.length" class="album-detail-row">
              <td colspan="5">
                <div class="album-items">
                  <div v-if="loadingAlbum" class="text-muted loading-items">Loading items...</div>
                  <div v-else class="items-grid">
                    <div v-for="item in albumItems" :key="item.id" class="album-item card">
                      <div class="item-thumb">
                        <img v-if="item.thumbnailUrl" :src="item.thumbnailUrl" :alt="item.title" />
                        <div v-else class="thumb-placeholder">
                          <span v-if="item.type === 'video'">▶</span>
                          <span v-else>📷</span>
                        </div>
                      </div>
                      <div class="item-info">
                        <div class="item-title">{{ item.title }}</div>
                        <div class="item-meta text-muted">{{ item.type }}</div>
                      </div>
                      <button class="btn btn-danger btn-xs" @click="deleteMediaItem(c, item)" :disabled="deleting">
                        {{ deleting === item ? '...' : '✕' }}
                      </button>
                    </div>
                  </div>
                  <div v-if="!loadingAlbum && !albumItems.length" class="text-muted empty-items">Album is empty.</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="!items.length" class="empty text-muted">No content found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const items        = ref([])
const filter       = ref('all')
const search       = ref('')
const deleting     = ref(null)
const expandedAlbum = ref(null)
const albumItems   = ref([])
const loadingAlbum = ref(false)
const tabs         = ref([
  { label: 'All',       value: 'all',       count: 0 },
  { label: 'Albums',    value: 'album',     count: 0 },
  { label: 'Photos & Videos', value: 'photo', count: 0 },
  { label: 'Documents', value: 'document',  count: 0 },
  { label: 'Stories',   value: 'story',     count: 0 },
])

async function toggleAlbum(c) {
  if (expandedAlbum.value?.id === c.id) {
    expandedAlbum.value = null
    albumItems.value = []
    return
  }
  expandedAlbum.value = c
  loadingAlbum.value = true
  try {
    const { data } = await api.get(`/media/albums/${c.id}`)
    albumItems.value = data.items || []
  } catch {
    albumItems.value = []
  } finally {
    loadingAlbum.value = false
  }
}

async function deleteMediaItem(album, item) {
  if (!confirm(`Delete "${item.title}" from this album?`)) return
  deleting.value = item
  try {
    await api.delete(`/media/${item.id}`)
    albumItems.value = albumItems.value.filter(i => i.id !== item.id)
    // Update the item count shown in the parent row
    if (album.itemCount != null) album.itemCount--
  } catch (e) {
    alert(e.response?.data?.message || 'Delete failed.')
  } finally {
    deleting.value = null
  }
}

async function deleteItem(c) {
  if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return
  deleting.value = c
  try {
    const endpoints = {
      'Photo Album': `/media/albums/${c.id}`,
      'Photo':       `/media/${c.id}`,
      'Document':    `/documents/${c.id}`,
      'Story':       `/stories/${c.id}`,
    }
    await api.delete(endpoints[c.type])
    if (expandedAlbum.value?.id === c.id) {
      expandedAlbum.value = null
      albumItems.value = []
    }
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Delete failed.')
  } finally {
    deleting.value = null
  }
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  try {
    // Always fetch albums + docs + stories for counts
    const { data: albumData } = await api.get('/media/albums')
    const albumsList = (albumData.albums || albumData || []).map(a => ({
      id: a.id, title: a.title, type: 'Photo Album', isPrivate: a.isPrivate, createdAt: a.createdAt,
      itemCount: a.itemCount
    }))

    const { data: docData } = await api.get('/documents')
    const docsList = (docData.documents || docData || []).map(d => ({
      id: d.id, title: d.title, type: 'Document', isPrivate: d.isPrivate, createdAt: d.createdAt
    }))

    const { data: storyData } = await api.get('/stories')
    const storiesList = (storyData.stories || storyData || []).map(s => ({
      id: s.id, title: s.title, type: 'Story', isPrivate: s.isPrivate, createdAt: s.createdAt
    }))

    // Fetch individual media items for Photos & Videos tab
    let photosList = []
    try {
      const { data: mediaData } = await api.get('/admin/media-items')
      photosList = (mediaData || []).map(m => ({
        id: m.id, title: m.title, type: 'Photo', mediaType: m.type,
        albumTitle: m.albumTitle, thumbnailUrl: m.thumbnailUrl,
        isPrivate: m.isPrivate, createdAt: m.createdAt
      }))
    } catch { /* media-items fetch failed — continue with empty list */ }

    // Compute counts from full data
    tabs.value[0].count = albumsList.length + docsList.length + storiesList.length
    tabs.value[1].count = albumsList.length
    tabs.value[2].count = photosList.length
    tabs.value[3].count = docsList.length
    tabs.value[4].count = storiesList.length

    // Filter displayed items
    let all = []
    if (filter.value === 'all')          all = [...albumsList, ...docsList, ...storiesList]
    else if (filter.value === 'album')   all = albumsList
    else if (filter.value === 'photo')   all = photosList
    else if (filter.value === 'document') all = docsList
    else if (filter.value === 'story')   all = storiesList

    if (search.value) {
      const q = search.value.toLowerCase()
      items.value = all.filter(c => c.title?.toLowerCase().includes(q))
    } else {
      items.value = all
    }
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
.btn-danger { background: #8b2020; color: #fff; border: 1px solid #a03030; cursor: pointer; }
.btn-danger:hover { background: #a03030; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Expand / drill-down */
.expand-btn {
  background: none;
  border: none;
  color: var(--color-gold);
  cursor: pointer;
  font-size: 14px;
  padding: 0 6px 0 0;
  line-height: 1;
}
.album-link { cursor: pointer; }
.album-link:hover { color: var(--color-gold); text-decoration: underline; }
.item-count { font-size: 12px; margin-left: 6px; }
.row-expandable td:first-child { cursor: pointer; }
.row-expanded { background: var(--color-bg-card); }

.album-detail-row td { padding: 0 !important; }
.album-items { padding: 12px 16px 16px 40px; background: var(--color-bg-surface); }
.loading-items { padding: 12px 0; font-size: 13px; }
.empty-items { padding: 12px 0; font-size: 13px; }

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.album-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}
.item-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-bg);
}
.item-thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: var(--color-text-faint);
}
.item-info { flex: 1; min-width: 0; }
.item-title { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta  { font-size: 11px; }
.btn-xs {
  padding: 3px 8px;
  font-size: 12px;
  line-height: 1;
  flex-shrink: 0;
}

/* Inline thumbnails for Photos tab rows */
.photo-inline {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-right: 8px;
}
.inline-thumb {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm, 4px);
  object-fit: cover;
  vertical-align: middle;
}
.inline-thumb-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm, 4px);
  background: var(--color-bg, #1a1a1a);
  color: var(--color-text-faint, #666);
  font-size: 14px;
}
</style>
