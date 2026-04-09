import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './AuthViews.css'

export default function RegisterView() {
  const register = useAuthStore(s => s.register)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', relation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card" style={{ maxWidth: 440 }}>
        <img src="/crest.png" alt="Wyatt Crest" className="auth-crest" />
        <h2 className="display-font auth-title">Join the Family</h2>
        <hr className="gold-rule" />
        <p className="auth-sub text-muted">
          Request access to the Wyatt Family archive. Your account will be reviewed and approved by the administrator.
        </p>

        {!submitted ? (
          <>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" required placeholder="Thomas" value={form.firstName} onChange={e => setField('firstName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" required placeholder="Wyatt" value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" required placeholder="Min. 8 characters" minLength="8" value={form.password} onChange={e => setField('password', e.target.value)} />
              </div>
              <div className="form-group">
                <label>How are you related to the Wyatt family?</label>
                <textarea rows="3" placeholder="e.g. I am Robert Wyatt's granddaughter..." value={form.relation} onChange={e => setField('relation', e.target.value)} />
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button className="btn btn-primary full-width" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Request Access'}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/login">Already have an account? Sign in →</Link>
            </div>
          </>
        ) : (
          <div className="success-msg">
            <div className="success-icon">✓</div>
            <h3>Request Submitted</h3>
            <p className="text-muted">
              Thank you, {form.firstName}. The administrator will review your request and you'll receive an email once approved.
            </p>
            <Link to="/" className="btn btn-secondary mt-2">Return Home</Link>
          </div>
        )}
      </div>
    </div>
  )
}
