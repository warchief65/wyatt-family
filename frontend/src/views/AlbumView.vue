<template>
  <div class="album-page" v-if="album">
    <div class="page-header">
      <RouterLink to="/photos" class="back-link text-muted">← Albums</RouterLink>
      <h1 class="display-font page-title">{{ album.title }}</h1>
      <p class="text-muted album-meta">{{ album.dateDisplay }} <span v-if="album.location">· {{ album.location }}</span></p>
      <p v-if="album.description" class="album-desc text-muted">{{ album.description }}</p>
      <div v-if="album.people?.length" class="album-tags">
        <span v-for="p in album.people" :key="p" class="badge">{{ p }}</span>
      </div>
      <hr class="gold-rule" />
    </div>

    <div class="album-content">
      <PhotoGrid :items="album.items" />

      <!-- Comments -->
      <CommentSection v-if="auth.isLoggedIn" :artifact-id="album.id" artifact-type="album" />
      <div v-else class="comment-gate text-muted">
        <RouterLink to="/login">Sign in</RouterLink> to view and post comments.
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading text-muted">Loading album...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PhotoGrid from '@/components/media/PhotoGrid.vue'
import CommentSection from '@/components/common/CommentSection.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route   = useRoute()
const auth    = useAuthStore()
const album   = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/media/albums/${route.params.id}`)
    album.value = data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { padding: 2rem 2rem 0; text-align: center; }
.back-link   { display: inline-block; margin-bottom: 1rem; font-size: 13px; }
.page-title  { font-size: 42px; margin-bottom: 6px; }
.album-meta  { font-size: 13px; margin-bottom: 6px; }
.album-desc  { font-size: 14px; max-width: 600px; margin: 0 auto 12px; line-height: 1.6; }
.album-tags  { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
.album-content { padding: 1.5rem 2rem; }
.comment-gate { font-size: 13px; margin-top: 2rem; padding: 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: center; }
.loading { text-align: center; padding: 4rem; }
</style>
