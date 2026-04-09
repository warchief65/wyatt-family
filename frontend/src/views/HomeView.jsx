import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PhotoGrid from '@/components/media/PhotoGrid'
import api from '@/services/api'
import './HomeView.css'

export default function HomeView() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [recentMedia, setRecentMedia] = useState([])
  const [recentStories, setRecentStories] = useState([])
  const [recentDocs, setRecentDocs] = useState([])
  const [recent, setRecent] = useState([])
  const [stats, setStats] = useState([
    { value: 0, label: 'Photos' },
    { value: 0, label: 'Videos' },
    { value: 0, label: 'People' },
    { value: 0, label: 'Stories' },
    { value: 0, label: 'Documents' },
  ])

  function doSearch() {
    if (query.trim()) navigate(`/photos?q=${query}`)
  }

  function docIcon(type) {
    const icons = { 'Birth Certificate': '📄', 'Letter': '✉️', 'Land Deed': '📜', 'Census Record': '📋', 'Military Record': '🎖️' }
    return icons[type] || '📄'
  }

  useEffect(() => {
    (async () => {
      try {
        const [mediaRes, storiesRes, docsRes, statsRes, recentRes] = await Promise.all([
          api.get('/media/recent?limit=8'),
          api.get('/stories?limit=3'),
          api.get('/documents?limit=5'),
          api.get('/stats'),
          api.get('/recent'),
        ])
        setRecentMedia(mediaRes.data)
        setRecentStories(storiesRes.data)
        setRecentDocs(docsRes.data)
        setRecent(recentRes.data)
        setStats([
          { value: statsRes.data.photos, label: 'Photos' },
          { value: statsRes.data.videos, label: 'Videos' },
          { value: statsRes.data.people, label: 'People' },
          { value: statsRes.data.stories, label: 'Stories' },
          { value: statsRes.data.documents, label: 'Documents' },
        ])
      } catch (e) {
        console.error('Home data load failed', e)
      }
    })()
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <div className="crest-wrapper">
          <img src="/crest.png" alt="Wyatt Coat of Arms" className="hero-crest" />
          <span className="sparkle s1" />
          <span className="sparkle s2" />
          <span className="sparkle s3" />
          <span className="sparkle s4" />
          <span className="sparkle s5" />
          <span className="sparkle s6" />
        </div>
        <h1 className="hero-title display-font">Wyatt Family</h1>
        <hr className="gold-rule hero-rule" />
        <p className="hero-tagline">Preserving Our History &nbsp;·&nbsp; Sharing Our Stories &nbsp;·&nbsp; alanwyatt.com</p>

        <div className="hero-search">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people, photos, stories, documents..." onKeyUp={e => e.key === 'Enter' && doSearch()} />
          <button className="btn btn-primary" onClick={doSearch}>Search</button>
        </div>

        <div className="hero-stats">
          {stats.map(s => (
            <div key={s.label} className="stat">
              <div className="stat-num">{s.value.toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="recent-bar">
        <span className="section-label">Recently Added</span>
        {recent.map(r => (
          <span key={r.id} className="recent-item">
            <Link to={r.link} className="text-gold">{r.title}</Link>
            <span className="text-muted"> · {r.type}</span>
          </span>
        ))}
      </div>

      <div className="home-content">
        <section className="home-section">
          <div className="section-header">
            <span className="section-label">Recent Photos &amp; Videos</span>
            <Link to="/photos" className="view-all">View all →</Link>
          </div>
          <PhotoGrid items={recentMedia} />
        </section>

        <div className="two-col">
          <section className="home-section">
            <div className="section-header">
              <span className="section-label">Latest Stories</span>
              <Link to="/stories" className="view-all">View all →</Link>
            </div>
            <div className="story-list">
              {recentStories.map(s => (
                <div key={s.id} className="story-card card">
                  <Link to={`/stories/${s.id}`}>
                    <span className="badge story-tag">{s.topic}</span>
                    <h3 className="story-title">{s.title}</h3>
                    <p className="text-muted story-meta">{s.dateDisplay} · {s.people?.join(', ')}</p>
                    <p className="story-excerpt text-muted">{s.excerpt}</p>
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="home-section">
            <div className="section-header">
              <span className="section-label">Recent Documents</span>
              <Link to="/documents" className="view-all">View all →</Link>
            </div>
            <div className="doc-list">
              {recentDocs.map(d => (
                <Link key={d.id} to={`/documents?id=${d.id}`} className="doc-item card">
                  <div className="doc-icon">{docIcon(d.type)}</div>
                  <div>
                    <div className="doc-name">{d.title}</div>
                    <div className="doc-type text-muted">{d.type} · {d.dateDisplay}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
