import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '@/services/api'
import './AdminSubmissions.css'

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('pending')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [statusTabs, setStatusTabs] = useState([
    { label: 'Pending',  value: 'pending',  count: 0 },
    { label: 'Approved', value: 'approved', count: 0 },
    { label: 'Rejected', value: 'rejected', count: 0 },
    { label: 'All',      value: 'all',      count: 0 },
  ])

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  async function load(f = filter) {
    const { data } = await api.get('/admin/submissions', { params: { status: f } })
    setSubmissions(data.submissions)
    setStatusTabs(prev => prev.map((s, i) => ({
      ...s,
      count: [data.counts.pending, data.counts.approved, data.counts.rejected, data.counts.all][i]
    })))
  }

  async function approve(s) {
    await api.post(`/admin/submissions/${s.id}/approve`)
    load()
  }

  function openReject(s) {
    setRejectTarget(s)
    setRejectReason('')
  }

  async function confirmReject() {
    await api.post(`/admin/submissions/${rejectTarget.id}/reject`, { reason: rejectReason })
    setRejectTarget(null)
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div className="admin-submissions">
      <h1 className="display-font admin-title">Content Submissions</h1>
      <hr className="gold-rule" />

      <div className="toolbar">
        <div className="filter-tabs">
          {statusTabs.map(s => (
            <button key={s.value}
              className={`btn btn-ghost btn-sm${filter === s.value ? ' active' : ''}`}
              onClick={() => { setFilter(s.value); load(s.value) }}>
              {s.label}
              {s.count > 0 && <span className="tab-count">{s.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="submissions-list">
        {submissions.map(s => (
          <div key={s.id} className="submission-card card">
            <div className="sub-header">
              <div>
                <span className={`badge badge-${s.status}`}>{s.status}</span>
                <span className="sub-type badge">{s.contentType}</span>
              </div>
              <span className="text-muted sub-date">{formatDate(s.submittedAt)}</span>
            </div>

            <h3 className="sub-title">{s.title}</h3>
            <p className="sub-author text-muted">Submitted by {s.submittedBy}</p>
            {s.description && <p className="sub-desc text-muted">{s.description}</p>}

            {s.files?.length > 0 && (
              <div className="sub-files">
                {s.files.map(f => (
                  <div key={f.url} className="sub-file">
                    {f.isImage ? <img src={f.url} className="file-thumb" alt="" /> : <div className="file-icon">📄</div>}
                    <span className="text-muted">{f.name}</span>
                  </div>
                ))}
              </div>
            )}

            {(s.date || s.location || s.people) && (
              <div className="sub-meta text-muted">
                {s.date && <span>📅 {s.date}</span>}
                {s.location && <span>📍 {s.location}</span>}
                {s.people && <span>👤 {s.people}</span>}
              </div>
            )}

            {s.status === 'pending' && (
              <div className="sub-actions">
                <button className="btn btn-primary btn-sm" onClick={() => approve(s)}>Approve &amp; Publish</button>
                <button className="btn btn-danger btn-sm" onClick={() => openReject(s)}>Reject</button>
              </div>
            )}
            {s.status !== 'pending' && s.rejectionReason && (
              <div className="rejection-reason text-muted">Rejection reason: {s.rejectionReason}</div>
            )}
          </div>
        ))}
        {!submissions.length && <div className="empty text-muted">No submissions found.</div>}
      </div>

      {/* Reject modal */}
      {rejectTarget && createPortal(
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setRejectTarget(null) }}>
          <div className="modal card">
            <h3>Reject Submission</h3>
            <p className="text-muted">Optionally provide a reason — it will be emailed to the submitter.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows="3" placeholder="Reason (optional)..." className="mt-1" />
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmReject}>Reject Submission</button>
              <button className="btn btn-ghost" onClick={() => setRejectTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
