import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '@/services/api'
import './DocumentsView.css'

export default function DocumentsView() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeDoc, setActiveDoc] = useState(null)
  const [filters, setFilters] = useState({ q: '', type: '' })

  const docTypes = [
    { value: 'BirthCertificate', label: 'Birth Certificate' },
    { value: 'DeathCertificate', label: 'Death Certificate' },
    { value: 'MarriageLicense',  label: 'Marriage License' },
    { value: 'Letter',           label: 'Letter' },
    { value: 'LandDeed',         label: 'Land Deed' },
    { value: 'CensusRecord',     label: 'Census Record' },
    { value: 'MilitaryRecord',   label: 'Military Record' },
    { value: 'Photograph',       label: 'Photograph' },
    { value: 'Other',            label: 'Other' },
  ]

  const typeIcon = t => ({ BirthCertificate:'📄', DeathCertificate:'📄', MarriageLicense:'💒', Letter:'✉️', LandDeed:'📜', CensusRecord:'📋', MilitaryRecord:'🎖️', Newspaper:'📰', Photograph:'📷' }[t] || '📄')

  function updateFilter(key, value) { const next = { ...filters, [key]: value }; setFilters(next); load(next) }

  async function load(f = filters) {
    setLoading(true)
    try { const { data } = await api.get('/documents', { params: f }); setDocuments(data) }
    finally { setLoading(false) }
  }

  async function openDoc(d) { const { data } = await api.get(`/documents/${d.id}`); setActiveDoc(data) }

  useEffect(() => { load() }, [])

  return (
    <div className="documents-page">
      <div className="page-header"><h1 className="display-font page-title">Documents &amp; Artifacts</h1><hr className="gold-rule" /></div>
      <div className="filters">
        <input value={filters.q} onChange={e => updateFilter('q', e.target.value)} placeholder="Search documents..." className="filter-input" />
        <select value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
          <option value="">All Types</option>
          {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="docs-content">
        {loading ? <div className="loading text-muted">Loading...</div>
         : !documents.length ? <div className="empty text-muted">No documents found.</div>
         : (
          <div className="docs-list">
            {documents.map(d => (
              <div key={d.id} className="doc-card card" onClick={() => openDoc(d)}>
                <div className="doc-icon">{typeIcon(d.type)}</div>
                <div className="doc-info">
                  <div className="doc-title">{d.title}</div>
                  <div className="doc-meta text-muted">{d.type}{d.dateDisplay && ` · ${d.dateDisplay}`}{d.location && ` · ${d.location}`}</div>
                  {d.description && <div className="doc-desc text-muted">{d.description}</div>}
                  {d.people?.length > 0 && <div className="doc-people">{d.people.map(p => <span key={p} className="badge">{p}</span>)}</div>}
                </div>
                {d.isPrivate && <span className="doc-lock">🔒</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeDoc && createPortal(
        <div className="doc-modal" onClick={e => { if (e.target === e.currentTarget) setActiveDoc(null) }}>
          <div className="doc-viewer">
            <div className="viewer-header">
              <h3>{activeDoc.title}</h3>
              <button className="close-btn" onClick={() => setActiveDoc(null)}>✕</button>
            </div>
            {(activeDoc.url?.endsWith('.pdf') || activeDoc.type === 'pdf') ? (
              <iframe src={activeDoc.url} className="pdf-viewer" />
            ) : (
              <img src={activeDoc.url} alt={activeDoc.title} className="img-viewer" />
            )}
            <div className="viewer-meta text-muted">
              {activeDoc.dateDisplay && <span>{activeDoc.dateDisplay}</span>}
              {activeDoc.location && <span> · {activeDoc.location}</span>}
              {activeDoc.source && <span> · Source: {activeDoc.source}</span>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
