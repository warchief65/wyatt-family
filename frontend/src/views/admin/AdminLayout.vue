<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-brand display-font">
        Admin
      </div>
      <nav class="sidebar-nav">
        <RouterLink
          to="/admin"
          exact-active-class="active"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/admin/users"
          active-class="active"
        >
          Users
        </RouterLink>
        <RouterLink
          to="/admin/submissions"
          active-class="active"
        >
          Submissions
          <span
            v-if="pendingCount"
            class="nav-badge"
          >{{ pendingCount }}</span>
        </RouterLink>
        <RouterLink
          to="/admin/content"
          active-class="active"
        >
          Content
        </RouterLink>
        <RouterLink
          to="/admin/comments"
          active-class="active"
        >
          Comments
        </RouterLink>
        <RouterLink
          to="/admin/donations"
          active-class="active"
        >
          Donations
        </RouterLink>
        <RouterLink
          to="/admin/bulk-upload"
          active-class="active"
        >
          Bulk Upload
        </RouterLink>
        <hr>
        <RouterLink to="/">
          ← View Site
        </RouterLink>
      </nav>
    </aside>

    <div class="admin-main">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
const pendingCount = ref(0)
onMounted(async () => {
  try {
    const { data } = await api.get('/admin/stats')
    pendingCount.value = data.pendingSubmissions + data.pendingUsers
  } catch { /* ignored */ }
})
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; }

.admin-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-border-gold);
  padding: 1.5rem 0;
  position: sticky;
  top: 56px;
  height: calc(100vh - 56px);
  overflow-y: auto;
}

.sidebar-brand {
  font-size: 24px;
  color: var(--color-gold);
  padding: 0 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.sidebar-nav { display: flex; flex-direction: column; }
.sidebar-nav a {
  padding: 10px 1.25rem;
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}
.sidebar-nav a:hover, .sidebar-nav a.active {
  color: var(--color-gold);
  background: var(--color-gold-deep);
}
.sidebar-nav hr { border-color: var(--color-border); margin: 8px 0; }

.nav-badge {
  background: var(--color-gold);
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 8px;
}

.admin-main { flex: 1; padding: 2rem; overflow: auto; }
</style>
