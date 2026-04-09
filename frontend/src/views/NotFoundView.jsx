import { Link } from 'react-router-dom'
import './NotFoundView.css'

export default function NotFoundView() {
  return (
    <div className="not-found">
      <img src="/crest.png" alt="Wyatt Crest" className="nf-crest" />
      <h1 className="display-font nf-title">Page Not Found</h1>
      <p className="text-muted">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-secondary mt-2">Return Home</Link>
    </div>
  )
}
