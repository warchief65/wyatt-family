import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './AuthViews.css'

export default function LoginView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore(s => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      const redirect = searchParams.get('redirect') || '/'
      navigate(redirect)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <img src="/crest.png" alt="Wyatt Crest" className="auth-crest" />
        <h2 className="display-font auth-title">Sign In</h2>
        <hr className="gold-rule" />

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => setField('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required placeholder="••••••••" value={form.password} onChange={e => setField('password', e.target.value)} />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn btn-primary full-width" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/register">Don't have an account? Join the family →</Link>
        </div>
      </div>
    </div>
  )
}
