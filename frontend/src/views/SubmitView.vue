<template>
  <div class="submit-page">
    <div class="page-header">
      <h1 class="display-font page-title">Submit Content</h1>
      <p class="text-muted page-sub">Share photos, videos, documents or stories for the family archive. All submissions are reviewed by the administrator before publishing.</p>
      <hr class="gold-rule" />
    </div>

    <div class="submit-content">
      <form @submit.prevent="handleSubmit" v-if="!submitted">
        <div class="form-group">
          <label>Content Type</label>
          <select v-model="form.contentType" required>
            <option value="">Select type...</option>
            <option value="photo">Photo(s)</option>
            <option value="video">Video</option>
            <option value="document">Document / Artifact</option>
            <option value="story">Story / Article</option>
          </select>
        </div>

        <div class="form-group">
          <label>Title</label>
          <input v-model="form.title" type="text" required placeholder="Brief descriptive title" />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" placeholder="Tell us about this content — the more detail the better!" />
        </div>

        <!-- File upload -->
        <div class="form-group">
          <label>File(s)</label>
          <div class="file-drop" @dragover.prevent @drop.prevent="onDrop" @click="fileInput.click()">
            <div v-if="!files.length" class="drop-hint">
              <span class="text-gold">Click to browse</span> or drag & drop files here
            </div>
            <div v-else class="file-list">
              <div v-for="(f, i) in files" :key="i" class="file-item">
                <span>{{ f.name }}</span>
                <button type="button" @click.stop="files.splice(i,1)">✕</button>
              </div>
            </div>
          </div>
          <input ref="fileInput" type="file" multiple hidden @change="onFileChange" accept="image/*,video/*,.pdf,.tiff" />
        </div>

        <!-- Shared metadata -->
        <div class="meta-section">
          <h3 class="section-label">Metadata <span class="text-muted">(helps with search)</span></h3>
          <hr class="gold-rule" />

          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input v-model="form.date" type="text" placeholder="e.g. July 1962 or circa 1940" />
            </div>
            <div class="form-group">
              <label>Location</label>
              <input v-model="form.location" type="text" placeholder="e.g. Memphis, TN" />
            </div>
          </div>

          <div class="form-group">
            <label>People in this content (comma separated)</label>
            <input v-model="form.people" type="text" placeholder="e.g. Robert Wyatt, Mary Wyatt" />
          </div>

          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input v-model="form.tags" type="text" placeholder="e.g. wedding, military, childhood" />
          </div>

          <div class="form-group">
            <label>Source / Where did you get this?</label>
            <input v-model="form.source" type="text" placeholder="e.g. Found in Aunt Helen's attic, 2024" />
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button class="btn btn-primary submit-btn" type="submit" :disabled="loading || !files.length">
          {{ loading ? 'Submitting...' : 'Submit for Review' }}
        </button>
      </form>

      <!-- Success -->
      <div v-else class="success-msg">
        <div class="success-icon">✓</div>
        <h3>Submission Received!</h3>
        <p class="text-muted">Thank you! Your submission has been logged and the administrator will review it shortly. You'll receive an email with the outcome.</p>
        <div class="success-actions">
          <button class="btn btn-secondary" @click="reset">Submit Another</button>
          <RouterLink to="/profile" class="btn btn-ghost">View My Submissions</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const fileInput = ref(null)
const files     = ref([])
const loading   = ref(false)
const submitted = ref(false)
const error     = ref('')

const form = ref({
  contentType: '', title: '', description: '',
  date: '', location: '', people: '', tags: '', source: ''
})

function onFileChange(e) { files.value = [...files.value, ...e.target.files] }
function onDrop(e)       { files.value = [...files.value, ...e.dataTransfer.files] }

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    const fd = new FormData()
    Object.entries(form.value).forEach(([k, v]) => fd.append(k, v))
    files.value.forEach(f => fd.append('files', f))
    await api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    submitted.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Submission failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function reset() {
  submitted.value = false
  files.value = []
  form.value = { contentType: '', title: '', description: '', date: '', location: '', people: '', tags: '', source: '' }
}
</script>

<style scoped>
.page-header  { padding: 2rem 2rem 0; text-align: center; }
.page-title   { font-size: 40px; margin-bottom: 8px; }
.page-sub     { font-size: 14px; max-width: 560px; margin: 0 auto 12px; line-height: 1.6; }
.submit-content { max-width: 640px; margin: 0 auto; padding: 2rem; }

.file-drop {
  border: 1px dashed var(--color-border-gold);
  border-radius: var(--radius-md);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.file-drop:hover { border-color: var(--color-gold); }
.drop-hint { font-size: 14px; color: var(--color-text-muted); }

.file-list { width: 100%; display: flex; flex-direction: column; gap: 6px; }
.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-card);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}
.file-item button { background: none; border: none; color: #e05555; cursor: pointer; }

.meta-section { margin-top: 1.5rem; }
.meta-section h3 { margin-bottom: 4px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.submit-btn { width: 100%; justify-content: center; padding: 12px; margin-top: 0.5rem; }
.error-msg  { color: #e05555; font-size: 13px; margin-bottom: 1rem; }

.success-msg { text-align: center; padding: 2rem 0; }
.success-icon { font-size: 48px; color: var(--color-gold); margin-bottom: 1rem; }
.success-msg h3 { color: var(--color-gold); font-size: 22px; margin-bottom: 0.75rem; }
.success-msg p  { font-size: 14px; line-height: 1.6; max-width: 400px; margin: 0 auto; }
.success-actions { display: flex; gap: 12px; justify-content: center; margin-top: 1.5rem; }

@media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
</style>
