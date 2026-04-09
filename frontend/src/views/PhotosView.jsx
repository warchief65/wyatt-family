import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/services/api'
import './PhotosView.css'

export default function PhotosView() {
  const [searchParams] = useSearchParams()
  const [albums, setAlbums] = useState([])
  const [people, setPeople] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ q: searchParams.get('q') || '', person: '', tag: '', from: '', to: '' })

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    load(next)
  }

  async function load(f = filters) {
    setLoading(true)
    try {
      const { data } = await api.get('/media/albums', { params: f })
      setAlbums(data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    Promise.all([api.get('/people?limit=100'), api.get('/tags')]).then(([pRes, tRes]) => {
      setPeople(pRes.data)
      setTags(tRes.data)
    })
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== filters.q) { updateFilter('q', q) }
  }, [searchParams])

  return (
    <div className="photos-page">
      <div className="page-header"><h1 className="display-font page-title">Photos &amp; Videos</h1><hr className="gold-rule" /></div>
      <div className="filters">
        <input value={filters.q} onChange={e => updateFilter('q', e.target.value)} placeholder="Search photos..." className="filter-input" />
        <select value={filters.person} onChange={e => updateFilter('person', e.target.value)}>
          <option value="">All People</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.tag} onChange={e => updateFilter('tag', e.target.value)}>
          <option value="">All Tags</option>
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={filters.from} onChange={e => updateFilter('from', e.target.value)} type="number" placeholder="From year" className="year-input" />
        <input value={filters.to} onChange={e => updateFilter('to', e.target.value)} type="number" placeholder="To year" className="year-input" />
      </div>
      <div className="photos-content">
        {loading ? <div className="loading text-muted">Loading...</div>
         : !albums.length ? <div className="empty text-muted">No albums found.</div>
         : (
          <div className="albums-grid">
            {albums.map(album => (
              <Link key={album.id} to={`/photos/${album.id}`} className="album-card card">
                <div className="album-thumb">
                  {album.coverUrl ? <img src={album.coverUrl} alt={album.title} /> : <div className="thumb-placeholder">📷</div>}
                  {album.isPrivate && <span className="badge badge-private album-badge">Private</span>}
                </div>
                <div className="album-meta">
                  <div className="album-title">{album.title}</div>
                  <div className="album-sub text-muted">{album.itemCount} items · {album.dateDisplay}</div>
                  {album.branch && <div className="album-branch text-muted">{album.branch}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
