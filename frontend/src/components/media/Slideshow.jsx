import { useState, useEffect, useRef, useMemo } from 'react'
import './Slideshow.css'

export default function Slideshow({ items, startIndex = 0, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(startIndex)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(4000)
  const [loop, setLoop] = useState(true)
  const elRef = useRef(null)

  const currentItem = items[currentSlide] || {}

  // Auto-focus for keyboard events
  useEffect(() => { elRef.current?.focus() }, [])

  // Autoplay
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= items.length - 1) return loop ? 0 : prev
        return prev + 1
      })
    }, Number(speed))
    return () => clearInterval(timer)
  }, [playing, speed, loop, items.length])

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose?.()
    if (e.key === 'ArrowLeft') setCurrentSlide(s => Math.max(0, s - 1))
    if (e.key === 'ArrowRight') setCurrentSlide(s => Math.min(items.length - 1, s + 1))
  }

  const thumbCount = Math.min(items.length, 8)

  return (
    <div ref={elRef} className="slideshow" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="ss-controls top">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Exit</button>
        <div className="ss-info display-font">{currentItem.title}</div>
        <div className="ss-counter text-muted">{currentSlide + 1} / {items.length}</div>
      </div>

      <div className="ss-stage">
        <button className="ss-nav ss-prev" onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}>‹</button>
        <div className="ss-media-wrap">
          {currentItem.type === 'video' ? (
            <video src={currentItem.url} controls className="ss-media" />
          ) : (
            <img src={currentItem.url || currentItem.thumbnailUrl} alt={currentItem.title} className="ss-media" />
          )}
        </div>
        <button className="ss-nav ss-next" onClick={() => setCurrentSlide(s => Math.min(items.length - 1, s + 1))}>›</button>
      </div>

      <div className="ss-meta">
        {currentItem.dateDisplay && <div className="text-muted">{currentItem.dateDisplay}</div>}
        {currentItem.location && <div className="text-muted">{currentItem.location}</div>}
        {currentItem.description && <div className="text-muted mt-1">{currentItem.description}</div>}
        {currentItem.people?.length > 0 && (
          <div className="ss-tags mt-1">
            {currentItem.people.map(p => <span key={p} className="badge">{p}</span>)}
          </div>
        )}
      </div>

      <div className="ss-thumbs">
        {items.slice(0, thumbCount).map((item, i) => (
          <div key={item.id || i} className={`thumb-item ${currentSlide === i ? 'active' : ''}`} onClick={() => setCurrentSlide(i)}>
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={item.title} />
            ) : (
              <div className="thumb-placeholder">{item.type === 'video' ? '▶' : '📷'}</div>
            )}
          </div>
        ))}
      </div>

      <div className="ss-controls bottom">
        <label className="text-muted">Speed</label>
        <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="speed-select">
          <option value={2000}>Fast (2s)</option>
          <option value={4000}>Normal (4s)</option>
          <option value={7000}>Slow (7s)</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => setPlaying(!playing)}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <label className="text-muted">
          <input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> Loop
        </label>
      </div>
    </div>
  )
}
