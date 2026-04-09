import { useState, useEffect } from 'react'
import api from '@/services/api'
import './AdminComments.css'

export default function AdminComments() {
  const [comments, setComments] = useState([])

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  async function load() {
    try {
      const { data } = await api.get('/admin/comments')
      setComments(data.comments || data || [])
    } catch { /* ignored */ }
  }

  async function deleteComment(id) {
    if (!confirm('Delete this comment?')) return
    try {
      await api.delete(`/comments/${id}`)
      load()
    } catch { /* ignored */ }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="admin-comments">
      <h1 className="display-font admin-title">Comments</h1>
      <hr className="gold-rule" />

      <div className="comments-list">
        {comments.map(c => (
          <div key={c.id} className="comment-card card">
            <div className="comment-header">
              <span className="comment-author">{c.authorName}</span>
              <span className="text-muted comment-target">on {c.artifactType} #{c.artifactId}</span>
              <span className="text-muted comment-date">{formatDate(c.createdAt)}</span>
            </div>
            <p className="comment-text">{c.text}</p>
            <div className="comment-actions">
              <button className="btn btn-danger btn-xs" onClick={() => deleteComment(c.id)}>Delete</button>
            </div>
          </div>
        ))}
        {!comments.length && <div className="empty text-muted">No comments found.</div>}
      </div>
    </div>
  )
}
