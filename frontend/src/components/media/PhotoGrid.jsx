import { useState } from 'react'
import { createPortal } from 'react-dom'
import Slideshow from './Slideshow'
import './PhotoGrid.css'

export default function PhotoGrid({ items = [] }) {
  const [mode, setMode] = useState('grid')
  const [lightbox, setLightbox] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)

  function openItem(item) { setLightbox(item) }

  function startSlideshow() {
    setSlideIndex(0)
    setMode('slide')
  }

  function prevItem() {
    const idx = items.indexOf(lightbox)
    if (idx > 0) setLightbox(items[idx - 1])
  }

  function nextItem() {
    const idx = items.indexOf(lightbox)
    if (idx < items.length - 1) setLightbox(items[idx + 1])
  }

  return (
    <div className="photo-grid-wrapper">
      <div className="view-toggle">
        <button className={`btn btn-ghost btn-sm ${mode === 'grid' ? 'active' : ''}`} onClick={() => setMode('grid')}>Grid</button>
        <button className={`btn btn-ghost btn-sm ${mode === 'slide' ? 'active' : ''}`} onClick={startSlideshow}>Slideshow</button>
      </div>

      {mode === 'grid' && (
        <div className="grid">
          {items.map(item => (
            <div key={item.id} className="grid-item card" onClick={() => openItem(item)}>
              <div className="thumb">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} loading="lazy" />
                ) : (
                  <div className="thumb-placeholder">
                    {item.type === 'video' ? '▶' : item.isPrivate ? '🔒' : '📷'}
                  </div>
                )}
                {item.type === 'video' && <span className="video-badge">▶</span>}
                {item.isPrivate && <span className="private-overlay">🔒</span>}
              </div>
              <div className="item-meta">
                <div className="item-title">{item.title}</div>
                <div className="item-sub text-muted">{item.dateDisplay}</div>
                {item.people?.length > 0 && (
                  <div className="item-tags">
                    {item.people.slice(0, 3).map(p => <span key={p} className="badge">{p}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'slide' && (
        <Slideshow items={items} startIndex={slideIndex} onClose={() => setMode('grid')} />
      )}

      {lightbox && createPortal(
        <div className="lightbox" onClick={e => { if (e.target === e.currentTarget) setLightbox(null) }}>
          <button className="lb-close" onClick={() => setLightbox(null)}>✕</button>
          <button className="lb-prev" onClick={prevItem}>‹</button>
          <button className="lb-next" onClick={nextItem}>›</button>
          <div className="lb-content">
            {lightbox.type === 'video' ? (
              <video src={lightbox.url} controls className="lb-media" />
            ) : (
              <img src={lightbox.url} alt={lightbox.title} className="lb-media" />
            )}
            <div className="lb-meta">
              <h3>{lightbox.title}</h3>
              <p className="text-muted">{lightbox.dateDisplay}</p>
              {lightbox.location && <p className="text-muted">{lightbox.location}</p>}
              {lightbox.description && <p>{lightbox.description}</p>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
