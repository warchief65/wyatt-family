import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [statCards, setStatCards] = useState([])
  const [pending, setPending] = useState({ users: 0, submissions: 0 })
  const [activity, setActivity] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/stats')
        setPending({ users: data.pendingUsers, submissions: data.pendingSubmissions })
        setStatCards([
          { label: 'Total Photos', value: data.photos, link: '/admin/content' },
          { label: 'Total Videos', value: data.videos, link: '/admin/content' },
          { label: 'Total Documents', value: data.documents, link: '/admin/content' },
          { label: 'Total Stories', value: data.stories, link: '/admin/content' },
          { label: 'Family Members', value: data.people, link: null },
          { label: 'Registered Users', value: data.users, link: '/admin/users' },
          { label: 'Total Comments', value: data.comments, link: '/admin/comments' },
          { label: 'Total Donations', value: `$${data.totalDonations?.toFixed(2) || '0.00'}`, link: '/admin/donations' },
        ])
        const actRes = await api.get('/admin/activity')
        setActivity(actRes.data)
      } catch { /* ignored */ }
    })()
  }, [])

  return (
    <div className="admin-dashboard">
      <h1 className="display-font admin-title">Dashboard</h1>
      <hr className="gold-rule" />

      <div className="stat-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label text-muted">{s.label}</div>
            {s.link && <Link to={s.link} className="stat-link">Manage →</Link>}
          </div>
        ))}
      </div>

      {(pending.users > 0 || pending.submissions > 0) && (
        <div className="pending-section">
          <h2 className="section-label">Needs Your Attention</h2>
          <hr className="gold-rule" />
          <div className="pending-cards">
            {pending.users > 0 && (
              <Link to="/admin/users" className="pending-card card">
                <div className="pending-count text-gold">{pending.users}</div>
                <div className="pending-label">Pending User{pending.users > 1 ? 's' : ''}</div>
              </Link>
            )}
            {pending.submissions > 0 && (
              <Link to="/admin/submissions" className="pending-card card">
                <div className="pending-count text-gold">{pending.submissions}</div>
                <div className="pending-label">Pending Submission{pending.submissions > 1 ? 's' : ''}</div>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="activity-section">
        <h2 className="section-label">Recent Activity</h2>
        <hr className="gold-rule" />
        <div className="activity-list">
          {activity.map(a => (
            <div key={a.id} className="activity-item">
              <span className="activity-icon">{a.icon}</span>
              <span className="activity-text">{a.text}</span>
              <span className="activity-time text-muted">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
