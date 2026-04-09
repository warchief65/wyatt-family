import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import './ThanksView.css'

export default function ThanksView() {
  const [donors, setDonors] = useState([])

  useEffect(() => {
    api.get('/donations/public').then(({ data }) => setDonors(data)).catch(() => {})
  }, [])

  return (
    <div className="thanks-page">
      <div className="page-header">
        <img src="/crest.png" alt="Wyatt Crest" className="thanks-crest" />
        <h1 className="display-font page-title">Thank You</h1>
        <hr className="gold-rule" />
        <p className="text-muted thanks-sub">
          Your generosity helps keep the Wyatt family archive alive and growing. We're grateful for every contribution.
        </p>
        <Link to="/" className="btn btn-secondary mt-2">Return Home</Link>
      </div>

      {donors.length > 0 && (
        <div className="donors-section">
          <h3 className="section-label">Our Supporters</h3>
          <hr className="gold-rule" />
          <div className="donors-list">
            {donors.map(d => (
              <div key={d.donorName + d.createdAt} className="donor-item">
                <div className="donor-name text-gold">{d.donorName}</div>
                {d.donorMessage && <div className="donor-msg text-muted">"{d.donorMessage}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
