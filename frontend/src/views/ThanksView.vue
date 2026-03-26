<template>
  <div class="thanks-page">
    <div class="page-header">
      <img
        src="/crest.png"
        alt="Wyatt Crest"
        class="thanks-crest"
      >
      <h1 class="display-font page-title">
        Thank You
      </h1>
      <hr class="gold-rule">
      <p class="text-muted thanks-sub">
        Your generosity helps keep the Wyatt family archive alive and growing. We're grateful for every contribution.
      </p>
      <RouterLink
        to="/"
        class="btn btn-secondary mt-2"
      >
        Return Home
      </RouterLink>
    </div>

    <div
      v-if="donors.length"
      class="donors-section"
    >
      <h3 class="section-label">
        Our Supporters
      </h3>
      <hr class="gold-rule">
      <div class="donors-list">
        <div
          v-for="d in donors"
          :key="d.donorName + d.createdAt"
          class="donor-item"
        >
          <div class="donor-name text-gold">
            {{ d.donorName }}
          </div>
          <div
            v-if="d.donorMessage"
            class="donor-msg text-muted"
          >
            "{{ d.donorMessage }}"
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const donors = ref([])

onMounted(async () => {
  try {
    const { data } = await api.get('/donations/public')
    donors.value = data
  } catch { /* ignored */ }
})
</script>

<style scoped>
.thanks-page { max-width: 640px; margin: 0 auto; padding: 2rem 1rem; }
.page-header { text-align: center; margin-bottom: 2rem; }
.thanks-crest { width: 80px; margin-bottom: 1rem; }
.page-title { font-size: 42px; margin-bottom: 8px; }
.thanks-sub { max-width: 500px; margin: 0 auto 1rem; }

.donors-section { margin-top: 2rem; }
.section-label { font-size: 18px; letter-spacing: 1px; }
.donors-list { display: flex; flex-direction: column; gap: 12px; margin-top: 1rem; }
.donor-item { padding: 12px 16px; border: 1px solid var(--color-border); border-radius: 6px; }
.donor-name { font-weight: 600; margin-bottom: 4px; }
.donor-msg { font-style: italic; font-size: 13px; }
</style>
