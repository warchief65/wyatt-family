<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="display-font page-title">
        My Profile
      </h1>
      <hr class="gold-rule">
    </div>

    <div class="profile-content">
      <div class="profile-card card">
        <div class="profile-avatar">
          {{ initials }}
        </div>
        <div class="profile-name">
          {{ auth.user?.firstName }} {{ auth.user?.lastName }}
        </div>
        <div class="profile-email text-muted">
          {{ auth.user?.email }}
        </div>
        <span
          class="badge"
          :class="`badge-${auth.user?.status}`"
        >{{ auth.user?.status }}</span>
      </div>

      <div class="submissions-section">
        <h2 class="section-label">
          My Submissions
        </h2>
        <hr class="gold-rule">
        <div
          v-if="loadError"
          class="empty text-muted"
        >
          {{ loadError }}
        </div>
        <div
          v-else-if="!submissions.length"
          class="empty text-muted"
        >
          You haven't submitted any content yet.
        </div>
        <div
          v-else
          class="submissions-list"
        >
          <div
            v-for="s in submissions"
            :key="s.id"
            class="sub-row card"
          >
            <div class="sub-info">
              <div class="sub-title">
                {{ s.title }}
              </div>
              <div class="sub-meta text-muted">
                {{ s.contentType }} · {{ formatDate(s.submittedAt) }}
              </div>
              <div
                v-if="s.rejectionReason"
                class="rejection-reason text-muted"
              >
                {{ s.rejectionReason }}
              </div>
            </div>
            <span :class="`badge badge-${s.status}`">{{ s.status }}</span>
          </div>
        </div>
        <RouterLink
          to="/submit"
          class="btn btn-secondary mt-2"
        >
          Submit More Content
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth        = useAuthStore()
const submissions = ref([])
const loadError   = ref('')

const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase()
})

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/submissions/mine')
    submissions.value = data
  } catch {
    loadError.value = 'Failed to load submissions. Please try again later.'
  }
})
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.page-title  { font-size: 40px; margin-bottom: 8px; }
.profile-content { max-width: 600px; margin: 0 auto; padding: 2rem; }

.profile-card { padding: 2rem; text-align: center; margin-bottom: 2rem; }
.profile-avatar { width: 70px; height: 70px; border-radius: 50%; background: var(--color-gold-deep); color: var(--color-gold); font-size: 24px; font-weight: 500; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
.profile-name  { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.profile-email { font-size: 14px; margin-bottom: 10px; }

.submissions-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1rem; }
.sub-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; gap: 12px; }
.sub-title { font-size: 14px; font-weight: 500; margin-bottom: 3px; }
.sub-meta  { font-size: 12px; }
.rejection-reason { font-size: 12px; font-style: italic; margin-top: 3px; }
.empty { padding: 1.5rem 0; }
</style>
