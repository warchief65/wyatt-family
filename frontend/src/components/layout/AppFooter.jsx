import { Link } from 'react-router-dom'
import './AppFooter.css'

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="footer-brand">
        <img src="/crest.png" alt="Wyatt Crest" className="footer-crest" />
        <div>
          <div className="display-font footer-name">Wyatt Family</div>
          <div className="footer-url">alanwyatt.com</div>
        </div>
      </div>

      <div className="footer-links">
        <Link to="/photos">Photos</Link>
        <Link to="/tree">Family Tree</Link>
        <Link to="/documents">Documents</Link>
        <Link to="/stories">Stories</Link>
      </div>

      <div className="footer-right">
        <Link to="/donate" className="btn btn-secondary btn-sm donate-btn">♥ Support This Site</Link>
        <div className="footer-copy">&copy; {year} Alan Wyatt &nbsp;·&nbsp; alanwyatt.com</div>
      </div>
    </footer>
  )
}
