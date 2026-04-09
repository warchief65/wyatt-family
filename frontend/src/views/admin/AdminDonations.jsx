import { useState, useEffect } from 'react'
import api from '@/services/api'
import './AdminDonations.css'

export default function AdminDonations() {
  const [donations, setDonations] = useState([])
  const [total, setTotal] = useState(0)
  const [count, setCount] = useState(0)

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/donations')
        setDonations(data.donations || [])
        setTotal(data.total || 0)
        setCount(data.count || 0)
      } catch { /* ignored */ }
    })()
  }, [])

  return (
    <div className="admin-donations">
      <h1 className="display-font admin-title">Donations</h1>
      <hr className="gold-rule" />

      <div className="stat-bar">
        <div className="stat-item">
          <span className="stat-value text-gold">${total.toFixed(2)}</span>
          <span className="stat-label text-muted">Total Received</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{count}</span>
          <span className="stat-label text-muted">Donations</span>
        </div>
      </div>

      <div className="donations-table">
        <table>
          <thead>
            <tr><th>Donor</th><th>Amount</th><th>Message</th><th>Public</th><th>Date</th></tr>
          </thead>
          <tbody>
            {donations.map(d => (
              <tr key={d.id}>
                <td>{d.donorName || 'Anonymous'}</td>
                <td className="text-gold">${d.amount.toFixed(2)}</td>
                <td className="text-muted">{d.donorMessage || '—'}</td>
                <td>{d.isPublic ? 'Yes' : 'No'}</td>
                <td className="text-muted">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!donations.length && <div className="empty text-muted">No donations yet.</div>}
      </div>
    </div>
  )
}
