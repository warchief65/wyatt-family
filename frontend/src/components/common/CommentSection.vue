<template>
  <div class="comment-section">
    <h3 class="section-label">
      Comments
    </h3>
    <hr class="gold-rule">

    <!-- Post comment -->
    <div class="post-comment">
      <textarea
        v-model="newComment"
        rows="3"
        placeholder="Leave a comment..."
        maxlength="1000"
      />
      <div class="post-actions">
        <span class="char-count text-muted">{{ newComment.length }}/1000</span>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!newComment.trim() || posting"
          @click="postComment"
        >
          {{ posting ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>
    </div>

    <!-- Comment list -->
    <div class="comment-list">
      <div
        v-if="!comments.length"
        class="no-comments text-muted"
      >
        No comments yet. Be the first!
      </div>
      <div
        v-for="c in comments"
        :key="c.id"
        class="comment-item"
      >
        <div class="comment-header">
          <span class="comment-author">{{ c.authorName }}</span>
          <span class="comment-date text-muted">{{ formatDate(c.createdAt) }}</span>
          <div class="comment-actions">
            <button
              v-if="canEdit(c)"
              class="btn-link"
              @click="startEdit(c)"
            >
              Edit
            </button>
            <button
              v-if="canDelete(c)"
              class="btn-link danger"
              @click="deleteComment(c.id)"
            >
              Delete
            </button>
          </div>
        </div>
        <div
          v-if="editingId !== c.id"
          class="comment-body"
        >
          {{ c.text }}
        </div>
        <div
          v-else
          class="edit-form"
        >
          <textarea
            v-model="editText"
            rows="2"
          />
          <div class="post-actions">
            <button
              class="btn btn-primary btn-sm"
              @click="saveEdit(c.id)"
            >
              Save
            </button>
            <button
              class="btn btn-ghost btn-sm"
              @click="editingId = null"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const props = defineProps({
  artifactId:   { type: [String, Number], required: true },
  artifactType: { type: String, required: true }
})

const auth       = useAuthStore()
const comments   = ref([])
const newComment = ref('')
const posting    = ref(false)
const editingId  = ref(null)
const editText   = ref('')

function canEdit(c)   { return auth.user?.id === c.authorId }
function canDelete(c) { return auth.isAdmin || auth.user?.id === c.authorId }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  const { data } = await api.get(`/comments/${props.artifactType}/${props.artifactId}`)
  comments.value = data
}

async function postComment() {
  if (!newComment.value.trim()) return
  posting.value = true
  try {
    await api.post('/comments', {
      artifactId:   props.artifactId,
      artifactType: props.artifactType,
      text:         newComment.value.trim()
    })
    newComment.value = ''
    await load()
  } finally {
    posting.value = false
  }
}

function startEdit(c) {
  editingId.value = c.id
  editText.value  = c.text
}

async function saveEdit(id) {
  await api.put(`/comments/${id}`, { text: editText.value })
  editingId.value = null
  await load()
}

async function deleteComment(id) {
  if (!confirm('Delete this comment?')) return
  await api.delete(`/comments/${id}`)
  await load()
}

onMounted(load)
</script>

<style scoped>
.comment-section { margin-top: 2.5rem; }
.post-comment { margin-bottom: 1.5rem; }
.post-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.char-count   { font-size: 11px; }
.btn-sm       { padding: 6px 14px; font-size: 12px; }

.comment-list { display: flex; flex-direction: column; gap: 12px; }
.no-comments  { font-size: 13px; padding: 1rem 0; }

.comment-item {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.comment-author { font-size: 13px; font-weight: 500; color: var(--color-gold); }
.comment-date   { font-size: 11px; flex: 1; }
.comment-actions { display: flex; gap: 8px; }
.comment-body   { font-size: 13px; line-height: 1.6; color: var(--color-text-muted); }

.btn-link {
  background: none;
  border: none;
  font-size: 11px;
  color: var(--color-gold-dark);
  cursor: pointer;
  padding: 0;
}
.btn-link:hover { color: var(--color-gold); }
.btn-link.danger:hover { color: #e05555; }

.edit-form textarea { margin-bottom: 6px; }
</style>
