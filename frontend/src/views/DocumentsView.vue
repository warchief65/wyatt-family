<template>
  <div class="documents-page">
    <div class="page-header">
      <h1 class="display-font page-title">Documents &amp; Artifacts</h1>
      <hr class="gold-rule" />
    </div>

    <div class="filters">
      <input v-model="filters.q" placeholder="Search documents..." @input="load" class="filter-input" />
      <select v-model="filters.type" @change="load">
        <option value="">All Types</option>
        <option v-for="t in docTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>

    <div class="docs-content">
      <div v-if="loading" class="loading text-muted">Loading...</div>
      <div v-else-if="!documents.length" class="empty text-muted">No documents found.</div>
      <div v-else class="docs-list">
        <div v-for="d in documents" :key="d.id" class="doc-card card" @click="openDoc(d)">
          <div class="doc-icon">{{ typeIcon(d.type) }}</div>
          <div class="doc-info">
            <div class="doc-title">{{ d.title }}</div>
            <div class="doc-meta text-muted">
              {{ d.type }}
              <span v-if="d.dateDisplay"> · {{ d.dateDisplay }}</span>
              <span v-if="d.location"> · {{ d.location }}</span>
            </div>
            <div v-if="d.description" class="doc-desc text-muted">{{ d.description }}</div>
            <div v-if="d.people?.length" class="doc-people">
              <span v-for="p in d.people" :key="p" class="badge">{{ p }}</span>
            </div>
          </div>
          <span v-if="d.isPrivate" class="doc-lock">🔒</span>
        </div>
      </div>
    </div>

    <!-- Document viewer modal -->
    <Teleport to="body">
      <div v-if="activeDoc" class="doc-modal" @click.self="activeDoc = null">
        <div class="doc-viewer">
          <div class="viewer-header">
            <h3>{{ activeDoc.title }}</h3>
            <button @click="activeDoc = null" class="close-btn">✕</button>
          </div>
          <iframe v-if="activeDoc.url?.endsWith('.pdf') || activeDoc.type === 'pdf'"
            :src="activeDoc.url" class="pdf-viewer" />
          <img v-else :src="activeDoc.url" :alt="activeDoc.title" class="img-viewer" />
          <div class="viewer-meta text-muted">
            <span v-if="activeDoc.dateDisplay">{{ activeDoc.dateDisplay }}</span>
            <span v-if="activeDoc.location"> · {{ activeDoc.location }}</span>
            <span v-if="activeDoc.source"> · Source: {{ activeDoc.source }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const documents = ref([])
const loading   = ref(false)
const activeDoc = ref(null)
const filters   = ref({ q: '', type: '' })

const docTypes = [
  { value: 'BirthCertificate', label: 'Birth Certificate' },
  { value: 'DeathCertificate', label: 'Death Certificate' },
  { value: 'MarriageLicense',  label: 'Marriage License' },
  { value: 'Letter',           label: 'Letter' },
  { value: 'LandDeed',         label: 'Land Deed' },
  { value: 'CensusRecord',     label: 'Census Record' },
  { value: 'MilitaryRecord',   label: 'Military Record' },
  { value: 'Photograph',       label: 'Photograph' },
  { value: 'Other',            label: 'Other' },
]

const typeIcon = t => ({ BirthCertificate:'📄', DeathCertificate:'📄', MarriageLicense:'💒',
  Letter:'✉️', LandDeed:'📜', CensusRecord:'📋', MilitaryRecord:'🎖️', Newspaper:'📰', Photograph:'📷' }[t] || '📄')

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/documents', { params: filters.value })
    documents.value = data
  } finally { loading.value = false }
}

async function openDoc(d) {
  const { data } = await api.get(`/documents/${d.id}`)
  activeDoc.value = data
}

onMounted(load)
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.page-title  { font-size: 40px; margin-bottom: 8px; }
.filters { display: flex; gap: 10px; padding: 1.25rem 2rem; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.filter-input { flex: 1; min-width: 200px; }
select { width: auto; }
.docs-content { padding: 1.5rem 2rem; }
.docs-list { display: flex; flex-direction: column; gap: 10px; }
.doc-card { display: flex; align-items: flex-start; gap: 14px; padding: 14px; cursor: pointer; transition: border-color 0.2s; }
.doc-card:hover { border-color: var(--color-gold-dark); }
.doc-icon  { font-size: 28px; flex-shrink: 0; width: 40px; text-align: center; }
.doc-info  { flex: 1; }
.doc-title { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.doc-meta  { font-size: 12px; margin-bottom: 4px; }
.doc-desc  { font-size: 13px; margin-bottom: 6px; line-height: 1.5; }
.doc-people { display: flex; gap: 4px; flex-wrap: wrap; }
.doc-lock  { font-size: 14px; flex-shrink: 0; }
.loading, .empty { text-align: center; padding: 3rem; }

.doc-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.doc-viewer { background: var(--color-bg-card); border: 1px solid var(--color-border-gold); border-radius: var(--radius-lg); width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.viewer-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); }
.viewer-header h3 { font-size: 16px; color: var(--color-gold); }
.close-btn { background: none; border: none; color: var(--color-text-muted); font-size: 18px; cursor: pointer; }
.pdf-viewer { flex: 1; min-height: 500px; border: none; }
.img-viewer { max-width: 100%; max-height: 65vh; object-fit: contain; margin: auto; display: block; padding: 1rem; }
.viewer-meta { padding: 10px 1.25rem; font-size: 12px; border-top: 1px solid var(--color-border); }
</style>
