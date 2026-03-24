<template>
  <div class="admin-comments">
    <h1 class="display-font admin-title">Comments</h1>
    <hr class="gold-rule" />

    <div class="comments-list">
      <div v-for="c in comments" :key="c.id" class="comment-card card">
        <div class="comment-header">
          <span class="comment-author">{{ c.authorName }}</span>
          <span class="text-muted comment-target">on {{ c.artifactType }} #{{ c.artifactId }}</span>
          <span class="text-muted comment-date">{{ formatDate(c.createdAt) }}</span>
        </div>
        <p class="comment-text">{{ c.text }}</p>
        <div class="comment-actions">
          <button class="btn btn-danger btn-xs" @click="deleteComment(c.id)">Delete</button>
        </div>
      </div>
      <div v-if="!comments.length" class="empty text-muted">No comments found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const comments = ref([])

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  try {
    const { data } = await api.get('/admin/comments')
    comments.value = data.comments || data || []
  } catch {}
}

async function deleteComment(id) {
  if (!confirm('Delete this comment?')) return
  try {
    await api.delete(`/comments/${id}`)
    load()
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.admin-title { font-size: 36px; margin-bottom: 8px; }

.comments-list { display: flex; flex-direction: column; gap: 12px; margin-top: 1.25rem; }
.comment-card { padding: 14px 16px; }
.comment-header { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; margin-bottom: 6px; }
.comment-author { font-weight: 600; font-size: 13px; }
.comment-target { font-size: 11px; }
.comment-date { font-size: 11px; margin-left: auto; }
.comment-text { font-size: 13px; margin-bottom: 8px; }
.comment-actions { display: flex; gap: 6px; }
.btn-xs { padding: 3px 10px; font-size: 11px; }
.empty { text-align: center; padding: 2rem; }
</style>
