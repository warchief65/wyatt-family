<template>
  <div class="admin-dashboard">
    <h1 class="display-font admin-title">
      Dashboard
    </h1>
    <hr class="gold-rule">

    <!-- Stat cards -->
    <div class="stat-grid">
      <div
        v-for="s in statCards"
        :key="s.label"
        class="stat-card"
      >
        <div class="stat-value">
          {{ s.value }}
        </div>
        <div class="stat-label text-muted">
          {{ s.label }}
        </div>
        <RouterLink
          v-if="s.link"
          :to="s.link"
          class="stat-link"
        >
          Manage →
        </RouterLink>
      </div>
    </div>

    <!-- Pending actions -->
    <div
      v-if="pending.users || pending.submissions"
      class="pending-section"
    >
      <h2 class="section-label">
        Needs Your Attention
      </h2>
      <hr class="gold-rule">
      <div class="pending-cards">
        <RouterLink
          v-if="pending.users"
          to="/admin/users"
          class="pending-card card"
        >
          <div class="pending-count text-gold">
            {{ pending.users }}
          </div>
          <div class="pending-label">
            Pending User{{ pending.users > 1 ? 's' : '' }}
          </div>
        </RouterLink>
        <RouterLink
          v-if="pending.submissions"
          to="/admin/submissions"
          class="pending-card card"
        >
          <div class="pending-count text-gold">
            {{ pending.submissions }}
          </div>
          <div class="pending-label">
            Pending Submission{{ pending.submissions > 1 ? 's' : '' }}
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="activity-section">
      <h2 class="section-label">
        Recent Activity
      </h2>
      <hr class="gold-rule">
      <div class="activity-list">
        <div
          v-for="a in activity"
          :key="a.id"
          class="activity-item"
        >
          <span class="activity-icon">{{ a.icon }}</span>
          <span class="activity-text">{{ a.text }}</span>
          <span class="activity-time text-muted">{{ a.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const statCards = ref([])
const pending   = ref({ users: 0, submissions: 0 })
const activity  = ref([])

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/stats')
    pending.value = { users: data.pendingUsers, submissions: data.pendingSubmissions }
    statCards.value = [
      { label: 'Total Photos',    value: data.photos,      link: '/admin/content' },
      { label: 'Total Videos',    value: data.videos,      link: '/admin/content' },
      { label: 'Total Documents', value: data.documents,   link: '/admin/content' },
      { label: 'Total Stories',   value: data.stories,     link: '/admin/content' },
      { label: 'Family Members',  value: data.people,      link: null },
      { label: 'Registered Users',value: data.users,       link: '/admin/users' },
      { label: 'Total Comments',  value: data.comments,    link: '/admin/comments' },
      { label: 'Total Donations', value: `$${data.totalDonations?.toFixed(2) || '0.00'}`, link: '/admin/donations' },
    ]
    const actRes = await api.get('/admin/activity')
    activity.value = actRes.data
  } catch { /* ignored */ }
})
</script>

<style scoped>
.admin-title { font-size: 36px; margin-bottom: 8px; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 2rem;
}
.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;
}
.stat-value { font-size: 28px; font-weight: 500; color: var(--color-gold); }
.stat-label { font-size: 11px; margin-top: 2px; margin-bottom: 8px; }
.stat-link  { font-size: 11px; color: var(--color-gold-dark); }
.stat-link:hover { color: var(--color-gold); }

.pending-section { margin-bottom: 2rem; }
.pending-cards { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 1rem; }
.pending-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 2rem;
  text-decoration: none;
  transition: border-color 0.2s;
  min-width: 140px;
}
.pending-card:hover { border-color: var(--color-gold); }
.pending-count { font-size: 36px; font-weight: 500; }
.pending-label { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }

.activity-section { margin-bottom: 2rem; }
.activity-list { display: flex; flex-direction: column; gap: 8px; margin-top: 1rem; }
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.activity-icon { font-size: 16px; flex-shrink: 0; }
.activity-text { flex: 1; }
.activity-time { font-size: 11px; flex-shrink: 0; }
</style>
