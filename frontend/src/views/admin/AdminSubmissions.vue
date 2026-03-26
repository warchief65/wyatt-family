<template>
  <div class="admin-submissions">
    <h1 class="display-font admin-title">
      Content Submissions
    </h1>
    <hr class="gold-rule">

    <div class="toolbar">
      <div class="filter-tabs">
        <button
          v-for="s in statusTabs"
          :key="s.value"
          :class="['btn btn-ghost btn-sm', filter === s.value && 'active']"
          @click="filter = s.value; load()"
        >
          {{ s.label }}
          <span
            v-if="s.count"
            class="tab-count"
          >{{ s.count }}</span>
        </button>
      </div>
    </div>

    <div class="submissions-list">
      <div
        v-for="s in submissions"
        :key="s.id"
        class="submission-card card"
      >
        <div class="sub-header">
          <div>
            <span :class="`badge badge-${s.status}`">{{ s.status }}</span>
            <span class="sub-type badge">{{ s.contentType }}</span>
          </div>
          <span class="sub-date text-muted">{{ formatDate(s.submittedAt) }}</span>
        </div>

        <h3 class="sub-title">
          {{ s.title }}
        </h3>
        <p class="sub-author text-muted">
          Submitted by {{ s.submittedBy }}
        </p>
        <p
          v-if="s.description"
          class="sub-desc text-muted"
        >
          {{ s.description }}
        </p>

        <!-- File previews -->
        <div
          v-if="s.files?.length"
          class="sub-files"
        >
          <div
            v-for="f in s.files"
            :key="f.url"
            class="sub-file"
          >
            <img
              v-if="f.isImage"
              :src="f.url"
              class="file-thumb"
            >
            <div
              v-else
              class="file-icon"
            >
              📄
            </div>
            <span class="text-muted">{{ f.name }}</span>
          </div>
        </div>

        <!-- Metadata -->
        <div
          v-if="s.date || s.location || s.people"
          class="sub-meta text-muted"
        >
          <span v-if="s.date">📅 {{ s.date }}</span>
          <span v-if="s.location">📍 {{ s.location }}</span>
          <span v-if="s.people">👤 {{ s.people }}</span>
        </div>

        <!-- Actions -->
        <div
          v-if="s.status === 'pending'"
          class="sub-actions"
        >
          <button
            class="btn btn-primary btn-sm"
            @click="approve(s)"
          >
            Approve &amp; Publish
          </button>
          <button
            class="btn btn-danger  btn-sm"
            @click="openReject(s)"
          >
            Reject
          </button>
        </div>
        <div
          v-else-if="s.rejectionReason"
          class="rejection-reason text-muted"
        >
          Rejection reason: {{ s.rejectionReason }}
        </div>
      </div>
      <div
        v-if="!submissions.length"
        class="empty text-muted"
      >
        No submissions found.
      </div>
    </div>

    <!-- Reject modal -->
    <Teleport to="body">
      <div
        v-if="rejectTarget"
        class="modal-overlay"
        @click.self="rejectTarget = null"
      >
        <div class="modal card">
          <h3>Reject Submission</h3>
          <p class="text-muted">
            Optionally provide a reason — it will be emailed to the submitter.
          </p>
          <textarea
            v-model="rejectReason"
            rows="3"
            placeholder="Reason (optional)..."
            class="mt-1"
          />
          <div class="modal-actions">
            <button
              class="btn btn-danger"
              @click="confirmReject"
            >
              Reject Submission
            </button>
            <button
              class="btn btn-ghost"
              @click="rejectTarget = null"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const submissions = ref([])
const filter      = ref('pending')
const rejectTarget= ref(null)
const rejectReason= ref('')

const statusTabs  = ref([
  { label: 'Pending',  value: 'pending',  count: 0 },
  { label: 'Approved', value: 'approved', count: 0 },
  { label: 'Rejected', value: 'rejected', count: 0 },
  { label: 'All',      value: 'all',      count: 0 },
])

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  const { data } = await api.get('/admin/submissions', { params: { status: filter.value } })
  submissions.value        = data.submissions
  statusTabs.value[0].count = data.counts.pending
  statusTabs.value[1].count = data.counts.approved
  statusTabs.value[2].count = data.counts.rejected
  statusTabs.value[3].count = data.counts.all
}

async function approve(s) {
  await api.post(`/admin/submissions/${s.id}/approve`)
  load()
}

function openReject(s) {
  rejectTarget.value = s
  rejectReason.value = ''
}

async function confirmReject() {
  await api.post(`/admin/submissions/${rejectTarget.value.id}/reject`, { reason: rejectReason.value })
  rejectTarget.value = null
  load()
}

onMounted(load)
</script>

<style scoped>
.admin-title  { font-size: 36px; margin-bottom: 8px; }
.toolbar      { margin-bottom: 1.25rem; }
.filter-tabs  { display: flex; gap: 6px; }
.btn-sm       { padding: 5px 12px; font-size: 11px; }
.active       { border-color: var(--color-gold) !important; color: var(--color-gold) !important; }
.tab-count    { background: var(--color-gold); color: #000; font-size: 9px; padding: 1px 5px; border-radius: 8px; margin-left: 4px; }

.submissions-list { display: flex; flex-direction: column; gap: 14px; }
.submission-card  { padding: 16px; }
.sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
.sub-type   { margin-left: 6px; }
.sub-date   { font-size: 11px; }
.sub-title  { font-size: 15px; margin-bottom: 4px; }
.sub-author { font-size: 12px; margin-bottom: 6px; }
.sub-desc   { font-size: 13px; line-height: 1.5; margin-bottom: 10px; }

.sub-files  { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.sub-file   { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; }
.file-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--color-border); }
.file-icon  { width: 80px; height: 60px; background: var(--color-bg-surface); display: flex; align-items: center; justify-content: center; font-size: 24px; border-radius: var(--radius-sm); }

.sub-meta   { display: flex; gap: 16px; font-size: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.sub-actions { display: flex; gap: 8px; }
.rejection-reason { font-size: 12px; font-style: italic; margin-top: 8px; }
.empty { text-align: center; padding: 2rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.modal { max-width: 440px; width: 100%; padding: 1.75rem; }
.modal h3 { margin-bottom: 8px; }
.modal-actions { display: flex; gap: 10px; margin-top: 1rem; }
</style>
