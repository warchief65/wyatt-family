import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import './ProfileView.css'

export default function ProfileView() {
  const user = useAuthStore(s => s.user)
  const [submissions, setSubmissions] = useState([])
  const [loadError, setLoadError] = useState('')

  const initials = useMemo(() => {
    if (!user) return '?'
    return ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase()
  }, [user])

  function formatDate(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    api.get('/submissions/mine')
      .then(({ data }) => setSubmissions(data))
      .catch(() => setLoadError('Failed to load submissions. Please try again later.'))
  }, [])

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="display-font page-title">My Profile</h1>
        <hr className="gold-rule" />
      </div>

      <div className="profile-content">
        <div className="profile-card card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">{user?.firstName} {user?.lastName}</div>
          <div className="profile-email text-muted">{user?.email}</div>
          <span className={`badge badge-${user?.status}`}>{user?.status}</span>
        </div>

        <div className="submissions-section">
          <h2 className="section-label">My Submissions</h2>
          <hr className="gold-rule" />
          {loadError ? (
            <div className="empty text-muted">{loadError}</div>
          ) : !submissions.length ? (
            <div className="empty text-muted">You haven't submitted any content yet.</div>
          ) : (
            <div className="submissions-list">
              {submissions.map(s => (
                <div key={s.id} className="sub-row card">
                  <div className="sub-info">
                    <div className="sub-title">{s.title}</div>
                    <div className="sub-meta text-muted">{s.contentType} · {formatDate(s.submittedAt)}</div>
                    {s.rejectionReason && <div className="rejection-reason text-muted">{s.rejectionReason}</div>}
                  </div>
                  <span className={`badge badge-${s.status}`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/submit" className="btn btn-secondary mt-2">Submit More Content</Link>
        </div>
      </div>
    </div>
  )
}
