<template>
  <div class="admin-donations">
    <h1 class="display-font admin-title">
      Donations
    </h1>
    <hr class="gold-rule">

    <div class="stat-bar">
      <div class="stat-item">
        <span class="stat-value text-gold">${{ total.toFixed(2) }}</span>
        <span class="stat-label text-muted">Total Received</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ count }}</span>
        <span class="stat-label text-muted">Donations</span>
      </div>
    </div>

    <div class="donations-table">
      <table>
        <thead>
          <tr>
            <th>Donor</th>
            <th>Amount</th>
            <th>Message</th>
            <th>Public</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="d in donations"
            :key="d.id"
          >
            <td>{{ d.donorName || 'Anonymous' }}</td>
            <td class="text-gold">
              ${{ d.amount.toFixed(2) }}
            </td>
            <td class="text-muted">
              {{ d.donorMessage || '—' }}
            </td>
            <td>{{ d.isPublic ? 'Yes' : 'No' }}</td>
            <td class="text-muted">
              {{ formatDate(d.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="!donations.length"
        class="empty text-muted"
      >
        No donations yet.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const donations = ref([])
const total     = ref(0)
const count     = ref(0)

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/donations')
    donations.value = data.donations || []
    total.value     = data.total || 0
    count.value     = data.count || 0
  } catch { /* ignored */ }
})
</script>

<style scoped>
.admin-title { font-size: 36px; margin-bottom: 8px; }

.stat-bar { display: flex; gap: 2rem; margin: 1.25rem 0; }
.stat-item { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-label { font-size: 11px; letter-spacing: 1px; }

.donations-table { overflow-x: auto; }
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
