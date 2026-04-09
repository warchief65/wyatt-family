import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import './StoriesView.css'

export default function StoriesView() {
  const [stories, setStories] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ q: '', topic: '' })

  async function load(f = filters) {
    setLoading(true)
    try {
      const { data } = await api.get('/stories', { params: f })
      setStories(data)
    } finally { setLoading(false) }
  }

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    load(next)
  }

  useEffect(() => {
    load()
    api.get('/tags').then(({ data }) => setTopics(data)).catch(() => {})
  }, [])

  return (
    <div className="stories-page">
      <div className="page-header">
        <h1 className="display-font page-title">Stories</h1>
        <hr className="gold-rule" />
      </div>

      <div className="filters">
        <input
          value={filters.q}
          onChange={e => updateFilter('q', e.target.value)}
          placeholder="Search stories..."
          className="filter-input"
        />
        <select value={filters.topic} onChange={e => updateFilter('topic', e.target.value)}>
          <option value="">All Topics</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="stories-content">
        {loading ? (
          <div className="loading text-muted">Loading...</div>
        ) : !stories.length ? (
          <div className="empty text-muted">No stories found.</div>
        ) : (
          <div className="stories-grid">
            {stories.map(s => (
              <Link key={s.id} to={`/stories/${s.id}`} className="story-card card">
                <div className="story-header">
                  {s.topic && <span className="badge">{s.topic}</span>}
                  {s.isPrivate && <span className="badge badge-private">Private</span>}
                </div>
                <h2 className="story-title">{s.title}</h2>
                {s.dateDisplay && <p className="story-meta text-muted">{s.dateDisplay}</p>}
                {s.people?.length > 0 && <p className="story-people text-muted">{s.people.join(', ')}</p>}
                {s.excerpt && <p className="story-excerpt text-muted">{s.excerpt}</p>}
                <span className="read-more">Read story →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
