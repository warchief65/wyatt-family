import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './AppNav.css'

export default function AppNav() {
  const auth = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    auth.logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <img src="/crest.png" alt="Wyatt Crest" className="nav-crest" />
          <span className="brand-name display-font">Wyatt</span>
        </Link>
      </div>

      <ul className="nav-links">
        <li><NavLink to="/photos">Photos &amp; Videos</NavLink></li>
        <li><NavLink to="/tree">Family Tree</NavLink></li>
        <li><NavLink to="/documents">Documents</NavLink></li>
        <li><NavLink to="/stories">Stories</NavLink></li>
      </ul>

      <div className="nav-right">
        {auth.token ? (
          <>
            {auth.user?.role === 'admin' && <Link to="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
            <Link to="/submit" className="btn btn-ghost btn-sm">Submit</Link>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Join</Link>
          </>
        )}

        <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/photos" onClick={() => setMenuOpen(false)}>Photos &amp; Videos</Link>
          <Link to="/tree" onClick={() => setMenuOpen(false)}>Family Tree</Link>
          <Link to="/documents" onClick={() => setMenuOpen(false)}>Documents</Link>
          <Link to="/stories" onClick={() => setMenuOpen(false)}>Stories</Link>
          <hr />
          {auth.token ? (
            <>
              <Link to="/submit" onClick={() => setMenuOpen(false)}>Submit Content</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link>
              {auth.user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
              <button onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Join</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
