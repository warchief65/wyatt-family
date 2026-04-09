import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import api from '@/services/api'
import './AdminLayout.css'

export default function AdminLayout() {
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setPendingCount(data.pendingSubmissions + data.pendingUsers))
      .catch(() => {})
  }, [])

  const links = [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/submissions', label: 'Submissions', badge: pendingCount || null },
    { to: '/admin/content', label: 'Content' },
    { to: '/admin/comments', label: 'Comments' },
    { to: '/admin/donations', label: 'Donations' },
    { to: '/admin/bulk-upload', label: 'Bulk Upload' },
  ]

  function isActive(link) {
    if (link.exact) return location.pathname === link.to
    return location.pathname.startsWith(link.to)
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand display-font">Admin</div>
        <nav className="sidebar-nav">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={isActive(l) ? 'active' : ''}>
              {l.label}
              {l.badge != null && <span className="nav-badge">{l.badge}</span>}
            </Link>
          ))}
          <hr />
          <Link to="/">← View Site</Link>
        </nav>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
