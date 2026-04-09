import { useState, useEffect } from 'react'
import api from '@/services/api'
import './AdminContent.css'

export default function AdminContent() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [expandedAlbum, setExpandedAlbum] = useState(null)
  const [albumItems, setAlbumItems] = useState([])
  const [loadingAlbum, setLoadingAlbum] = useState(false)
  const [tabs, setTabs] = useState([
    { label: 'All',       value: 'all',      count: 0 },
    { label: 'Albums',    value: 'album',     count: 0 },
    { label: 'Photos & Videos', value: 'photo', count: 0 },
    { label: 'Documents', value: 'document',  count: 0 },
    { label: 'Stories',   value: 'story',     count: 0 },
  ])

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  async function toggleAlbum(c) {
    if (expandedAlbum?.id === c.id) {
      setExpandedAlbum(null)
      setAlbumItems([])
      return
    }
    setExpandedAlbum(c)
    setLoadingAlbum(true)
    try {
      const { data } = await api.get(`/media/albums/${c.id}`)
      setAlbumItems(data.items || [])
    } catch { setAlbumItems([]) }
    finally { setLoadingAlbum(false) }
  }

  async function deleteMediaItem(album, item) {
    if (!confirm(`Delete "${item.title}" from this album?`)) return
    setDeleting(item)
    try {
      await api.delete(`/media/${item.id}`)
      setAlbumItems(prev => prev.filter(i => i.id !== item.id))
      if (album.itemCount != null) album.itemCount--
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed.')
    } finally { setDeleting(null) }
  }

  async function deleteItem(c) {
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return
    setDeleting(c)
    try {
      const endpoints = {
        'Photo Album': `/media/albums/${c.id}`,
        'Photo':       `/media/${c.id}`,
        'Document':    `/documents/${c.id}`,
        'Story':       `/stories/${c.id}`,
      }
      await api.delete(endpoints[c.type])
      if (expandedAlbum?.id === c.id) {
        setExpandedAlbum(null)
        setAlbumItems([])
      }
      await load()
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed.')
    } finally { setDeleting(null) }
  }

  async function load(f = filter, q = search) {
    try {
      const { data: albumData } = await api.get('/media/albums')
      const albumsList = (albumData.albums || albumData || []).map(a => ({
        id: a.id, title: a.title, type: 'Photo Album', isPrivate: a.isPrivate, createdAt: a.createdAt, itemCount: a.itemCount
      }))
      const { data: docData } = await api.get('/documents')
      const docsList = (docData.documents || docData || []).map(d => ({
        id: d.id, title: d.title, type: 'Document', isPrivate: d.isPrivate, createdAt: d.createdAt
      }))
      const { data: storyData } = await api.get('/stories')
      const storiesList = (storyData.stories || storyData || []).map(s => ({
        id: s.id, title: s.title, type: 'Story', isPrivate: s.isPrivate, createdAt: s.createdAt
      }))

      let photosList = []
      try {
        const { data: mediaData } = await api.get('/admin/media-items')
        photosList = (mediaData || []).map(m => ({
          id: m.id, title: m.title, type: 'Photo', mediaType: m.type,
          albumTitle: m.albumTitle, thumbnailUrl: m.thumbnailUrl,
          isPrivate: m.isPrivate, createdAt: m.createdAt
        }))
      } catch { /* ignored */ }

      setTabs(prev => prev.map((t, i) => ({
        ...t,
        count: [albumsList.length + docsList.length + storiesList.length, albumsList.length, photosList.length, docsList.length, storiesList.length][i]
      })))

      let all = []
      if (f === 'all')          all = [...albumsList, ...docsList, ...storiesList]
      else if (f === 'album')   all = albumsList
      else if (f === 'photo')   all = photosList
      else if (f === 'document') all = docsList
      else if (f === 'story')   all = storiesList

      if (q) {
        const lower = q.toLowerCase()
        setItems(all.filter(c => c.title?.toLowerCase().includes(lower)))
      } else {
        setItems(all)
      }
    } catch { /* ignored */ }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="admin-content">
      <h1 className="display-font admin-title">Content</h1>
      <hr className="gold-rule" />

      <div className="toolbar">
        <div className="filter-tabs">
          {tabs.map(t => (
            <button key={t.value}
              className={`btn btn-ghost btn-sm${filter === t.value ? ' active' : ''}`}
              onClick={() => { setFilter(t.value); load(t.value, search) }}>
              {t.label}
              {t.count > 0 && <span className="tab-count">{t.count}</span>}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => { setSearch(e.target.value); load(filter, e.target.value) }} placeholder="Search content..." className="search-input" />
      </div>

      <div className="content-table">
        <table>
          <thead>
            <tr><th>Title</th><th>Type</th><th>Private</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map(c => (
              <>
                <tr key={c.type + c.id} className={`${c.type === 'Photo Album' ? 'row-expandable' : ''} ${expandedAlbum?.id === c.id ? 'row-expanded' : ''}`}>
                  <td>
                    {c.type === 'Photo Album' && (
                      <button className="expand-btn" onClick={() => toggleAlbum(c)}>
                        {expandedAlbum?.id === c.id ? '▾' : '▸'}
                      </button>
                    )}
                    {c.type === 'Photo' && (
                      <span className="photo-inline">
                        {c.thumbnailUrl
                          ? <img src={c.thumbnailUrl} className="inline-thumb" alt="" />
                          : <span className="inline-thumb-placeholder">{c.mediaType === 'video' ? '▶' : '📷'}</span>}
                      </span>
                    )}
                    <span className={c.type === 'Photo Album' ? 'album-link' : ''} onClick={() => c.type === 'Photo Album' && toggleAlbum(c)}>
                      {c.title}
                    </span>
                    {c.type === 'Photo Album' && c.itemCount != null && <span className="item-count text-muted">({c.itemCount} items)</span>}
                    {c.albumTitle && <span className="item-count text-muted">in {c.albumTitle}</span>}
                  </td>
                  <td><span className="badge">{c.type}</span></td>
                  <td>{c.isPrivate ? 'Yes' : 'No'}</td>
                  <td className="text-muted">{formatDate(c.createdAt)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" disabled={!!deleting} onClick={() => deleteItem(c)}>
                      {deleting === c ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
                {expandedAlbum?.id === c.id && (
                  <tr key={`detail-${c.id}`} className="album-detail-row">
                    <td colSpan="5">
                      <div className="album-items">
                        {loadingAlbum ? (
                          <div className="text-muted loading-items">Loading items...</div>
                        ) : albumItems.length ? (
                          <div className="items-grid">
                            {albumItems.map(item => (
                              <div key={item.id} className="album-item card">
                                <div className="item-thumb">
                                  {item.thumbnailUrl
                                    ? <img src={item.thumbnailUrl} alt={item.title} />
                                    : <div className="thumb-placeholder"><span>{item.type === 'video' ? '▶' : '📷'}</span></div>}
                                </div>
                                <div className="item-info">
                                  <div className="item-title">{item.title}</div>
                                  <div className="item-meta text-muted">{item.type}</div>
                                </div>
                                <button className="btn btn-danger btn-xs" disabled={!!deleting} onClick={() => deleteMediaItem(c, item)}>
                                  {deleting === item ? '...' : '✕'}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted empty-items">Album is empty.</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {!items.length && <div className="empty text-muted">No content found.</div>}
      </div>
    </div>
  )
}
