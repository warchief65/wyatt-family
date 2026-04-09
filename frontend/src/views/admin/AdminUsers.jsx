import { useState, useEffect } from 'react'
import api from '@/services/api'
import './AdminUsers.css'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState([
    { label: 'All', value: 'all', count: 0 },
    { label: 'Pending', value: 'pending', count: 0 },
    { label: 'Approved', value: 'approved', count: 0 },
    { label: 'Inactive', value: 'inactive', count: 0 },
  ])

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  async function load(f = filter, q = search) {
    const { data } = await api.get('/admin/users', { params: { status: f, q } })
    setUsers(data.users)
    setStatuses(prev => prev.map((s, i) => ({
      ...s,
      count: [data.counts.all, data.counts.pending, data.counts.approved, data.counts.inactive][i]
    })))
  }

  async function approve(id) { await api.post(`/admin/users/${id}/approve`); load() }
  async function reject(id) { await api.post(`/admin/users/${id}/reject`); load() }
  async function deactivate(id) { await api.post(`/admin/users/${id}/deactivate`); load() }
  async function deleteUser(id) {
    if (!confirm('Permanently delete this user?')) return
    await api.delete(`/admin/users/${id}`)
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div className="admin-users">
      <h1 className="display-font admin-title">Users</h1>
      <hr className="gold-rule" />

      <div className="toolbar">
        <div className="filter-tabs">
          {statuses.map(s => (
            <button key={s.value}
              className={`btn btn-ghost btn-sm${filter === s.value ? ' active' : ''}`}
              onClick={() => { setFilter(s.value); load(s.value, search) }}>
              {s.label}
              {s.count > 0 && <span className="tab-count">{s.count}</span>}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => { setSearch(e.target.value); load(filter, e.target.value) }} placeholder="Search users..." className="search-input" />
      </div>

      <div className="user-table">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td className="text-muted">{u.email}</td>
                <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                <td className="text-muted">{formatDate(u.createdAt)}</td>
                <td className="actions">
                  {u.status === 'pending' && <button className="btn btn-primary btn-xs" onClick={() => approve(u.id)}>Approve</button>}
                  {u.status === 'pending' && <button className="btn btn-danger btn-xs" onClick={() => reject(u.id)}>Reject</button>}
                  {u.status === 'approved' && <button className="btn btn-ghost btn-xs" onClick={() => deactivate(u.id)}>Deactivate</button>}
                  {u.status === 'inactive' && <button className="btn btn-ghost btn-xs" onClick={() => approve(u.id)}>Reactivate</button>}
                  <button className="btn btn-danger btn-xs" onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <div className="empty text-muted">No users found.</div>}
      </div>
    </div>
  )
}
