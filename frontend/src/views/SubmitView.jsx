import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import './SubmitView.css'

const ACCEPTED_TYPES = ['image/', 'video/', 'application/pdf', 'image/tiff']
const MAX_TOTAL_BYTES = 200_000_000

function isAcceptedFile(file) {
  return ACCEPTED_TYPES.some(t => file.type.startsWith(t))
}

export default function SubmitView() {
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    contentType: '', title: '', description: '',
    date: '', location: '', people: '', tags: '', source: ''
  })

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  function onFileChange(e) {
    setFiles(prev => [...prev, ...e.target.files])
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    const dropped = [...e.dataTransfer.files].filter(isAcceptedFile)
    if (dropped.length !== e.dataTransfer.files.length) {
      setError('Some files were skipped because they are not an accepted type.')
    }
    const totalSize = [...files, ...dropped].reduce((sum, f) => sum + f.size, 0)
    if (totalSize > MAX_TOTAL_BYTES) { setError('Total file size exceeds 200 MB limit.'); return }
    setFiles(prev => [...prev, ...dropped])
  }

  function removeFile(i) { setFiles(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      files.forEach(f => fd.append('files', f))
      await api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally { setLoading(false) }
  }

  function reset() {
    setSubmitted(false)
    setFiles([])
    setForm({ contentType: '', title: '', description: '', date: '', location: '', people: '', tags: '', source: '' })
  }

  return (
    <div className="submit-page">
      <div className="page-header">
        <h1 className="display-font page-title">Submit Content</h1>
        <p className="text-muted page-sub">
          Share photos, videos, documents or stories for the family archive. All submissions are reviewed by the administrator before publishing.
        </p>
        <hr className="gold-rule" />
      </div>

      <div className="submit-content">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Content Type</label>
              <select value={form.contentType} onChange={e => setField('contentType', e.target.value)} required>
                <option value="">Select type...</option>
                <option value="photo">Photo(s)</option>
                <option value="video">Video</option>
                <option value="document">Document / Artifact</option>
                <option value="story">Story / Article</option>
              </select>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input type="text" required placeholder="Brief descriptive title" value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea rows="4" placeholder="Tell us about this content — the more detail the better!" value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>

            <div className="form-group">
              <label>File(s)</label>
              <div className="file-drop" onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}>
                {!files.length ? (
                  <div className="drop-hint"><span className="text-gold">Click to browse</span> or drag &amp; drop files here</div>
                ) : (
                  <div className="file-list">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${f.size}-${f.lastModified}`} className="file-item">
                        <span>{f.name}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); removeFile(i) }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple hidden accept="image/*,video/*,.pdf,.tiff" onChange={onFileChange} />
            </div>

            <div className="meta-section">
              <h3 className="section-label">Metadata <span className="text-muted">(helps with search)</span></h3>
              <hr className="gold-rule" />

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="text" placeholder="e.g. July 1962 or circa 1940" value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" placeholder="e.g. Memphis, TN" value={form.location} onChange={e => setField('location', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>People in this content (comma separated)</label>
                <input type="text" placeholder="e.g. Robert Wyatt, Mary Wyatt" value={form.people} onChange={e => setField('people', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input type="text" placeholder="e.g. wedding, military, childhood" value={form.tags} onChange={e => setField('tags', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Source / Where did you get this?</label>
                <input type="text" placeholder="e.g. Found in Aunt Helen's attic, 2024" value={form.source} onChange={e => setField('source', e.target.value)} />
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn btn-primary submit-btn" type="submit" disabled={loading || !files.length}>
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        ) : (
          <div className="success-msg">
            <div className="success-icon">✓</div>
            <h3>Submission Received!</h3>
            <p className="text-muted">
              Thank you! Your submission has been logged and the administrator will review it shortly. You'll receive an email with the outcome.
            </p>
            <div className="success-actions">
              <button className="btn btn-secondary" onClick={reset}>Submit Another</button>
              <Link to="/profile" className="btn btn-ghost">View My Submissions</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
