<template>
  <div class="admin-bulk">
    <h1 class="display-font admin-title">Bulk Upload</h1>
    <p class="text-muted admin-sub">Upload many files at once to quickly populate the archive.</p>
    <hr class="gold-rule" />

    <!-- Success summary -->
    <div v-if="result" class="result-card card">
      <div class="result-icon">✓</div>
      <h3>Upload Complete</h3>
      <p class="text-muted">{{ result.uploaded }} file(s) uploaded successfully.</p>
      <button class="btn btn-primary" @click="reset">Upload More</button>
    </div>

    <!-- Upload form -->
    <form v-else @submit.prevent="handleUpload" class="upload-form">
      <!-- Content type -->
      <div class="form-row">
        <div class="form-group">
          <label>Content Type</label>
          <select v-model="form.contentType" required>
            <option value="">Select type...</option>
            <option value="photo">Photos &amp; Videos</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      <!-- Shared metadata -->
      <div class="form-row" v-if="form.contentType === 'photo' || form.contentType === 'video'">
        <div class="form-group flex-2">
          <label>Album</label>
          <div class="combo-box" :class="{ open: showAlbumDropdown }">
            <input
              v-model="albumSearch"
              type="text"
              placeholder="Type to create new or select existing..."
              @focus="showAlbumDropdown = true"
              @input="onAlbumInput"
              autocomplete="off"
            />
            <div v-if="showAlbumDropdown && (filteredAlbums.length || albumSearch)" class="combo-dropdown">
              <div v-if="albumSearch && !exactMatch"
                class="combo-option combo-new"
                @mousedown.prevent="selectNewAlbum">
                <span class="combo-new-icon">＋</span>
                Create new album: <strong>"{{ albumSearch }}"</strong>
              </div>
              <div
                v-for="a in filteredAlbums"
                :key="a.id"
                class="combo-option"
                :class="{ selected: selectedAlbumId === a.id }"
                @mousedown.prevent="selectExistingAlbum(a)">
                <span class="combo-title">{{ a.title }}</span>
                <span class="combo-meta text-muted">{{ a.itemCount }} items · {{ a.dateDisplay || 'No date' }}</span>
              </div>
              <div v-if="!filteredAlbums.length && !albumSearch" class="combo-empty text-muted">
                No albums yet — type a name to create one
              </div>
            </div>
          </div>
          <div v-if="selectedAlbumId" class="combo-selected-tag">
            Adding to: <strong>{{ albumSearch }}</strong>
            <button type="button" class="combo-clear" @click="clearAlbumSelection">✕</button>
          </div>
        </div>
        <div class="form-group">
          <label>Date / Era</label>
          <input v-model="form.date" type="text" placeholder="e.g. Summer 1985, 1940s" />
        </div>
      </div>

      <div class="form-row" v-if="form.contentType === 'document'">
        <div class="form-group flex-2">
          <label>Title (leave blank to use file names)</label>
          <input v-model="form.title" type="text" placeholder="e.g. Family Letters" />
        </div>
        <div class="form-group">
          <label>Date / Era</label>
          <input v-model="form.date" type="text" placeholder="e.g. Summer 1985, 1940s" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-2">
          <label>Description</label>
          <textarea v-model="form.description" rows="2" placeholder="Optional description for the batch" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input v-model="form.location" type="text" placeholder="e.g. Grandma's house" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Source</label>
          <input v-model="form.source" type="text" placeholder="e.g. Uncle Bob's attic" />
        </div>
        <div class="form-group">
          <label>Tags</label>
          <input v-model="form.tags" type="text" placeholder="e.g. reunion, birthday" />
        </div>
      </div>

      <!-- File drop zone -->
      <div class="form-group">
        <label>Files ({{ files.length }} selected)</label>
        <div class="drop-zone"
          :class="{ dragover }"
          @dragover.prevent="dragover = true"
          @dragleave="dragover = false"
          @drop.prevent="onDrop"
          @click="$refs.fileInput.click()">
          <input ref="fileInput" type="file" multiple @change="onFileChange" class="hidden-input" />
          <div class="drop-content">
            <div class="drop-icon">📁</div>
            <p>Drag &amp; drop files here, or <span class="drop-link">click to browse</span></p>
            <p class="text-muted drop-hint">
              {{ form.contentType === 'document' ? 'PDFs, images, scans' : 'Images and videos' }}
              · No limit on number of files
            </p>
          </div>
        </div>
      </div>

      <!-- File list preview -->
      <div v-if="files.length" class="file-list">
        <div v-for="(f, i) in files" :key="i" class="file-item">
          <span class="file-icon">{{ f.type.startsWith('image/') ? '🖼️' : f.type.startsWith('video/') ? '🎬' : '📄' }}</span>
          <span class="file-name">{{ f.name }}</span>
          <span class="file-size text-muted">{{ formatSize(f.size) }}</span>
          <button type="button" class="file-remove" @click="removeFile(i)">✕</button>
        </div>
        <div class="file-summary text-muted">
          {{ files.length }} files · {{ formatSize(totalSize) }} total
        </div>
      </div>

      <!-- Progress bar -->
      <div v-if="uploading" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        <span class="progress-text">{{ Math.round(progress) }}%</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-msg">{{ error }}</div>

      <!-- Submit -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="uploading || !files.length || !form.contentType">
          {{ uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}` }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'

const fileInput = ref(null)
const files     = ref([])
const uploading = ref(false)
const progress  = ref(0)
const error     = ref('')
const result    = ref(null)
const dragover  = ref(false)

const form = ref({
  contentType: '', title: '', description: '',
  date: '', location: '', source: '', tags: ''
})

// Album combo box state
const albums            = ref([])
const albumSearch       = ref('')
const selectedAlbumId   = ref(null)
const showAlbumDropdown = ref(false)

const filteredAlbums = computed(() => {
  if (!albumSearch.value) return albums.value
  const q = albumSearch.value.toLowerCase()
  return albums.value.filter(a => a.title.toLowerCase().includes(q))
})

const exactMatch = computed(() =>
  albums.value.some(a => a.title.toLowerCase() === albumSearch.value.toLowerCase())
)

async function loadAlbums() {
  try {
    const { data } = await api.get('/media/albums')
    albums.value = (data.albums || data || [])
  } catch {}
}

function onAlbumInput() {
  selectedAlbumId.value = null
  showAlbumDropdown.value = true
}

function selectExistingAlbum(a) {
  albumSearch.value = a.title
  selectedAlbumId.value = a.id
  showAlbumDropdown.value = false
}

function selectNewAlbum() {
  selectedAlbumId.value = null
  showAlbumDropdown.value = false
}

function clearAlbumSelection() {
  selectedAlbumId.value = null
  albumSearch.value = ''
}

// Close dropdown when clicking outside
function onDocClick(e) {
  if (!e.target.closest('.combo-box')) showAlbumDropdown.value = false
}

watch(() => form.value.contentType, (val) => {
  if (val === 'photo' || val === 'video') loadAlbums()
})

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

const totalSize = computed(() => files.value.reduce((sum, f) => sum + f.size, 0))

function onFileChange(e) {
  files.value = [...files.value, ...e.target.files]
  e.target.value = ''
}

function onDrop(e) {
  dragover.value = false
  files.value = [...files.value, ...e.dataTransfer.files]
}

function removeFile(i) {
  files.value.splice(i, 1)
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function reset() {
  files.value = []
  progress.value = 0
  error.value = ''
  result.value = null
  albumSearch.value = ''
  selectedAlbumId.value = null
  form.value = { contentType: form.value.contentType, title: '', description: '', date: '', location: '', source: '', tags: '' }
  loadAlbums()
}

async function handleUpload() {
  error.value = ''
  uploading.value = true
  progress.value = 0

  try {
    const fd = new FormData()
    fd.append('contentType', form.value.contentType)
    fd.append('description', form.value.description)
    fd.append('date', form.value.date)
    fd.append('location', form.value.location)
    fd.append('source', form.value.source)
    fd.append('tags', form.value.tags)

    if (form.value.contentType === 'photo' || form.value.contentType === 'video') {
      if (selectedAlbumId.value) {
        fd.append('albumId', selectedAlbumId.value)
      }
      fd.append('title', albumSearch.value || form.value.title)
    } else {
      fd.append('title', form.value.title)
    }

    files.value.forEach(f => fd.append('files', f))

    const { data } = await api.post('/admin/bulk-upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress(e) {
        if (e.total) progress.value = (e.loaded / e.total) * 100
      }
    })
    result.value = data
  } catch (e) {
    error.value = e.response?.data?.message || 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.admin-title { font-size: 36px; margin-bottom: 4px; }
.admin-sub   { font-size: 14px; margin-bottom: 0; }

.upload-form { max-width: 720px; }

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 0;
}
.form-row .form-group { flex: 1; }
.form-row .flex-2     { flex: 2; }

/* Album combo box */
.combo-box { position: relative; }
.combo-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-gold);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  max-height: 220px;
  overflow-y: auto;
}
.combo-option {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
}
.combo-option:last-child { border-bottom: none; }
.combo-option:hover { background: var(--color-bg-surface); }
.combo-option.selected { background: var(--color-gold-deep); }
.combo-new {
  color: var(--color-gold);
  gap: 6px;
  justify-content: flex-start;
}
.combo-new-icon { font-size: 16px; margin-right: 4px; }
.combo-title { font-weight: 500; }
.combo-meta  { font-size: 12px; flex-shrink: 0; }
.combo-empty { padding: 12px 14px; font-size: 13px; text-align: center; }
.combo-selected-tag {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-gold);
  display: flex;
  align-items: center;
  gap: 8px;
}
.combo-clear {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
}
.combo-clear:hover { color: #e55; }

.drop-zone {
  border: 2px dashed var(--color-border-gold);
  border-radius: var(--radius-md);
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-bg-surface);
}
.drop-zone:hover,
.drop-zone.dragover {
  border-color: var(--color-gold);
  background: rgba(var(--rgb-gold, 212, 175, 55), 0.05);
}
.drop-icon  { font-size: 32px; margin-bottom: 8px; }
.drop-link  { color: var(--color-gold); text-decoration: underline; cursor: pointer; }
.drop-hint  { font-size: 12px; margin-top: 4px; }
.hidden-input { display: none; }

.file-list {
  margin-top: 12px;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--color-border);
}
.file-item:last-of-type { border-bottom: none; }
.file-icon { flex-shrink: 0; }
.file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { flex-shrink: 0; font-size: 11px; }
.file-remove {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; font-size: 14px; padding: 2px 4px; line-height: 1;
}
.file-remove:hover { color: #c44; }
.file-summary { padding: 8px 12px; font-size: 12px; border-top: 1px solid var(--color-border); }

.progress-bar {
  margin-top: 12px;
  height: 24px;
  background: var(--color-bg-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-gold);
  border-radius: 12px;
  transition: width 0.3s;
}
.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-bg);
  mix-blend-mode: difference;
}

.error-msg {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(200, 50, 50, 0.1);
  border: 1px solid rgba(200, 50, 50, 0.3);
  border-radius: var(--radius-md);
  color: #e55;
  font-size: 13px;
}

.form-actions { margin-top: 1.25rem; }

.result-card {
  max-width: 400px;
  text-align: center;
  padding: 2.5rem;
}
.result-icon {
  width: 48px; height: 48px;
  background: var(--color-gold);
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 12px;
}
.result-card h3 { margin-bottom: 4px; }
.result-card .btn { margin-top: 1rem; }
</style>
