<template>
  <div class="admin-users">
    <h1 class="display-font admin-title">
      Users
    </h1>
    <hr class="gold-rule">

    <div class="toolbar">
      <div class="filter-tabs">
        <button
          v-for="s in statuses"
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
      <input
        v-model="search"
        placeholder="Search users..."
        class="search-input"
        @input="load"
      >
    </div>

    <div class="user-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in users"
            :key="u.id"
          >
            <td>{{ u.firstName }} {{ u.lastName }}</td>
            <td class="text-muted">
              {{ u.email }}
            </td>
            <td><span :class="`badge badge-${u.status}`">{{ u.status }}</span></td>
            <td class="text-muted">
              {{ formatDate(u.createdAt) }}
            </td>
            <td class="actions">
              <button
                v-if="u.status === 'pending'"
                class="btn btn-primary btn-xs"
                @click="approve(u.id)"
              >
                Approve
              </button>
              <button
                v-if="u.status === 'pending'"
                class="btn btn-danger  btn-xs"
                @click="reject(u.id)"
              >
                Reject
              </button>
              <button
                v-if="u.status === 'approved'"
                class="btn btn-ghost   btn-xs"
                @click="deactivate(u.id)"
              >
                Deactivate
              </button>
              <button
                v-if="u.status === 'inactive'"
                class="btn btn-ghost   btn-xs"
                @click="approve(u.id)"
              >
                Reactivate
              </button>
              <button
                class="btn btn-danger btn-xs"
                @click="deleteUser(u.id)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="!users.length"
        class="empty text-muted"
      >
        No users found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const users  = ref([])
const filter = ref('all')
const search = ref('')
const statuses = ref([
  { label: 'All',      value: 'all',      count: 0 },
  { label: 'Pending',  value: 'pending',  count: 0 },
  { label: 'Approved', value: 'approved', count: 0 },
  { label: 'Inactive', value: 'inactive', count: 0 },
])

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  const { data } = await api.get('/admin/users', { params: { status: filter.value, q: search.value } })
  users.value = data.users
  statuses.value[0].count = data.counts.all
  statuses.value[1].count = data.counts.pending
  statuses.value[2].count = data.counts.approved
  statuses.value[3].count = data.counts.inactive
}

async function approve(id)    { await api.post(`/admin/users/${id}/approve`);    load() }
async function reject(id)     { await api.post(`/admin/users/${id}/reject`);     load() }
async function deactivate(id) { await api.post(`/admin/users/${id}/deactivate`); load() }
async function deleteUser(id) {
  if (!confirm('Permanently delete this user?')) return
  await api.delete(`/admin/users/${id}`)
  load()
}

onMounted(load)
</script>

<style scoped>
.admin-title { font-size: 36px; margin-bottom: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 12px; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 6px; }
.btn-sm  { padding: 5px 12px; font-size: 11px; }
.btn-xs  { padding: 3px 10px; font-size: 11px; }
.active  { border-color: var(--color-gold) !important; color: var(--color-gold) !important; }
.tab-count { background: var(--color-gold); color: #000; font-size: 9px; padding: 1px 5px; border-radius: 8px; margin-left: 4px; }
.search-input { width: 200px; }

.user-table { overflow-x: auto; }
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
.actions { display: flex; gap: 6px; flex-wrap: wrap; }
.empty { text-align: center; padding: 2rem; }
</style>
