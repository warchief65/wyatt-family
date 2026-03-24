<template>
  <div class="story-page" v-if="story">
    <div class="page-header">
      <RouterLink to="/stories" class="back-link text-muted">← Stories</RouterLink>
      <span v-if="story.topic" class="badge story-topic">{{ story.topic }}</span>
      <h1 class="display-font story-title">{{ story.title }}</h1>
      <div class="story-meta">
        <span v-if="story.dateDisplay" class="text-muted">{{ story.dateDisplay }}</span>
        <span v-if="story.people?.length" class="text-muted"> · {{ story.people.map(p => p.name).join(', ') }}</span>
      </div>
      <hr class="gold-rule" />
    </div>

    <article class="story-body" v-html="story.body" />

    <div class="story-footer">
      <div class="tagged-people" v-if="story.people?.length">
        <span class="section-label">People in this story</span>
        <div class="people-chips">
          <RouterLink v-for="p in story.people" :key="p.id" :to="`/tree?person=${p.id}`" class="person-chip">
            {{ p.name }}
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="story-comments">
      <CommentSection v-if="auth.isLoggedIn" :artifact-id="story.id" artifact-type="story" />
      <div v-else class="comment-gate text-muted">
        <RouterLink to="/login">Sign in</RouterLink> to view and post comments.
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading text-muted">Loading story...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CommentSection from '@/components/common/CommentSection.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route   = useRoute()
const auth    = useAuthStore()
const story   = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/stories/${route.params.id}`)
    story.value = data
  } finally { loading.value = false }
})
</script>

<style scoped>
.page-header  { padding: 2rem 2rem 0; text-align: center; }
.back-link    { display: inline-block; margin-bottom: 1rem; font-size: 13px; }
.story-topic  { margin-bottom: 12px; }
.story-title  { font-size: 44px; line-height: 1.1; margin-bottom: 10px; }
.story-meta   { font-size: 13px; margin-bottom: 0; }

.story-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-muted);
}
.story-body :deep(h2), .story-body :deep(h3) { color: var(--color-gold); margin: 1.5rem 0 0.75rem; }
.story-body :deep(img) { max-width: 100%; border-radius: var(--radius-md); margin: 1rem 0; }
.story-body :deep(blockquote) { border-left: 3px solid var(--color-gold-dark); padding-left: 1rem; color: var(--color-text-muted); font-style: italic; }

.story-footer { max-width: 720px; margin: 0 auto; padding: 0 2rem 2rem; }
.tagged-people { margin-top: 1.5rem; }
.section-label { display: block; margin-bottom: 10px; }
.people-chips  { display: flex; gap: 8px; flex-wrap: wrap; }
.person-chip {
  background: var(--color-gold-subtle);
  color: var(--color-gold);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  text-decoration: none;
  transition: background 0.2s;
}
.person-chip:hover { background: var(--color-gold-deep); }

.story-comments { max-width: 720px; margin: 0 auto; padding: 0 2rem 3rem; }
.comment-gate { font-size: 13px; padding: 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: center; }
.loading { text-align: center; padding: 4rem; }
</style>
