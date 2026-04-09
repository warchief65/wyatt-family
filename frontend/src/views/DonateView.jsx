import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import './DonateView.css'

const presets = [5, 10, 25, 50]

export default function DonateView() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const [donors, setDonors] = useState([])
  const [customAmount, setCustomAmount] = useState('')
  const [form, setForm] = useState({ amount: 10, donorName: '', donorMessage: '', isPublic: true })

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleDonate(e) {
    e.preventDefault()
    if (!form.amount || form.amount < 1) return
    setLoading(true)
    setStripeError('')
    try {
      const { data } = await api.post('/donations/intent', {
        amount: form.amount,
        donorName: form.donorName || null,
        donorMessage: form.donorMessage || null,
        isPublic: form.isPublic,
      })
      console.log('Stripe client secret:', data.clientSecret)
      setSuccess(true)
    } catch (err) {
      setStripeError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    api.get('/donations/public').then(({ data }) => setDonors(data)).catch(() => {})
  }, [])

  return (
    <div className="donate-page">
      <div className="page-header">
        <img src="/crest.png" alt="Wyatt Crest" className="donate-crest" />
        <h1 className="display-font page-title">Support This Site</h1>
        <hr className="gold-rule" />
        <p className="text-muted donate-sub">
          alanwyatt.com is a free, family-run archive. Any contribution helps cover
          hosting, storage, and domain costs (approximately $12/month).
          Every donation is appreciated — no amount is too small.
        </p>
      </div>

      <div className="donate-content">
        {!success ? (
          <form onSubmit={handleDonate}>
            <div className="form-group">
              <label>Donation Amount</label>
              <div className="amount-grid">
                {presets.map(a => (
                  <button key={a} type="button"
                    className={`amount-btn btn ${form.amount === a ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setField('amount', a); setCustomAmount('') }}>
                    ${a}
                  </button>
                ))}
                <button type="button"
                  className={`amount-btn btn ${customAmount ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setCustomAmount(''); setField('amount', 0) }}>
                  Custom
                </button>
              </div>
              {(!form.amount || customAmount !== '') && (
                <input type="number" min="1" step="1" placeholder="Enter amount ($)" className="mt-1"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setField('amount', Number(e.target.value)) }} />
              )}
            </div>

            <div className="form-group">
              <label>Your Name <span className="text-muted">(optional)</span></label>
              <input type="text" placeholder="Thomas Wyatt" value={form.donorName} onChange={e => setField('donorName', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Message <span className="text-muted">(optional)</span></label>
              <textarea rows="2" placeholder="A kind word for the family..." value={form.donorMessage} onChange={e => setField('donorMessage', e.target.value)} />
            </div>

            <div className="form-group public-toggle">
              <label className="toggle-label">
                <input type="checkbox" checked={form.isPublic} onChange={e => setField('isPublic', e.target.checked)} />
                Display my name on the public Thank You page
              </label>
            </div>

            <div id="stripe-element" className="stripe-element" />
            {stripeError && <p className="error-msg">{stripeError}</p>}

            <p className="secure-note text-muted">🔒 Payments are processed securely by Stripe. We never store your card details.</p>

            <button className="btn btn-primary donate-btn" type="submit" disabled={loading || !form.amount}>
              {loading ? 'Processing...' : `Donate $${form.amount || ''}`}
            </button>
          </form>
        ) : (
          <div className="success-msg">
            <div className="success-icon">♥</div>
            <h3>Thank You!</h3>
            <p className="text-muted">Your generosity helps keep the Wyatt family archive alive and growing. We're grateful.</p>
            <Link to="/" className="btn btn-secondary mt-2">Return Home</Link>
          </div>
        )}

        {donors.length > 0 && (
          <div className="donors-section">
            <h3 className="section-label">Thank You to Our Supporters</h3>
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
    </div>
  )
}
