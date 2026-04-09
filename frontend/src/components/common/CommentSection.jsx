import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import './CommentSection.css'

export default function CommentSection({ artifactId, artifactType }) {
  const auth = useAuthStore()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  function canEdit(c) { return auth.user?.id === c.authorId }
  function canDelete(c) { return auth.user?.role === 'admin' || auth.user?.id === c.authorId }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  async function load() {
    const { data } = await api.get(`/comments/${artifactType}/${artifactId}`)
    setComments(data)
  }

  async function postComment() {
    if (!newComment.trim()) return
    setPosting(true)
    try {
      await api.post('/comments', { artifactId, artifactType, text: newComment.trim() })
      setNewComment('')
      await load()
    } finally {
      setPosting(false)
    }
  }

  function startEdit(c) {
    setEditingId(c.id)
    setEditText(c.text)
  }

  async function saveEdit(id) {
    await api.put(`/comments/${id}`, { text: editText })
    setEditingId(null)
    await load()
  }

  async function deleteComment(id) {
    if (!confirm('Delete this comment?')) return
    await api.delete(`/comments/${id}`)
    await load()
  }

  useEffect(() => { load() }, [artifactId, artifactType])

  return (
    <div className="comment-section">
      <h3 className="section-label">Comments</h3>
      <hr className="gold-rule" />

      <div className="post-comment">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
          placeholder="Leave a comment..."
          maxLength={1000}
        />
        <div className="post-actions">
          <span className="char-count text-muted">{newComment.length}/1000</span>
          <button className="btn btn-primary btn-sm" disabled={!newComment.trim() || posting} onClick={postComment}>
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      <div className="comment-list">
        {!comments.length && <div className="no-comments text-muted">No comments yet. Be the first!</div>}
        {comments.map(c => (
          <div key={c.id} className="comment-item">
            <div className="comment-header">
              <span className="comment-author">{c.authorName}</span>
              <span className="comment-date text-muted">{formatDate(c.createdAt)}</span>
              <div className="comment-actions">
                {canEdit(c) && <button className="btn-link" onClick={() => startEdit(c)}>Edit</button>}
                {canDelete(c) && <button className="btn-link danger" onClick={() => deleteComment(c.id)}>Delete</button>}
              </div>
            </div>
            {editingId !== c.id ? (
              <div className="comment-body">{c.text}</div>
            ) : (
              <div className="edit-form">
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} />
                <div className="post-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => saveEdit(c.id)}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
