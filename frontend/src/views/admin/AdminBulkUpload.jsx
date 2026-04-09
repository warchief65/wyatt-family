import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import api from '@/services/api'
import './AdminBulkUpload.css'

export default function AdminBulkUpload() {
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dragover, setDragover] = useState(false)
  const [form, setForm] = useState({
    contentType: '', title: '', description: '',
    date: '', location: '', source: '', tags: ''
  })

  // Album combo box state
  const [albums, setAlbums] = useState([])
  const [albumSearch, setAlbumSearch] = useState('')
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false)

  const filteredAlbums = useMemo(() => {
    if (!albumSearch) return albums
    const q = albumSearch.toLowerCase()
    return albums.filter(a => a.title.toLowerCase().includes(q))
  }, [albums, albumSearch])

  const exactMatch = useMemo(() =>
    albums.some(a => a.title.toLowerCase() === albumSearch.toLowerCase()),
    [albums, albumSearch]
  )

  const totalSize = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files])

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  async function loadAlbums() {
    try {
      const { data } = await api.get('/media/albums')
      setAlbums(data.albums || data || [])
    } catch { /* ignored */ }
  }

  function onAlbumInput(e) {
    setAlbumSearch(e.target.value)
    setSelectedAlbumId(null)
    setShowAlbumDropdown(true)
  }

  function selectExistingAlbum(a) {
    setAlbumSearch(a.title)
    setSelectedAlbumId(a.id)
    setShowAlbumDropdown(false)
  }

  function selectNewAlbum() {
    setSelectedAlbumId(null)
    setShowAlbumDropdown(false)
  }

  function clearAlbumSelection() {
    setSelectedAlbumId(null)
    setAlbumSearch('')
  }

  // Close dropdown when clicking outside
  const onDocClick = useCallback((e) => {
    if (!e.target.closest('.combo-box')) setShowAlbumDropdown(false)
  }, [])

  useEffect(() => {
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [onDocClick])

  useEffect(() => {
    if (form.contentType === 'photo' || form.contentType === 'video') loadAlbums()
  }, [form.contentType])

  function onFileChange(e) {
    setFiles(prev => [...prev, ...e.target.files])
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragover(false)
    setFiles(prev => [...prev, ...e.dataTransfer.files])
  }

  function removeFile(i) { setFiles(prev => prev.filter((_, idx) => idx !== i)) }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  function reset() {
    setFiles([])
    setProgress(0)
    setError('')
    setResult(null)
    setAlbumSearch('')
    setSelectedAlbumId(null)
    setForm(prev => ({ contentType: prev.contentType, title: '', description: '', date: '', location: '', source: '', tags: '' }))
    loadAlbums()
  }

  async function handleUpload(e) {
    e.preventDefault()
    setError('')
    setUploading(true)
    setProgress(0)

    try {
      const fd = new FormData()
      fd.append('contentType', form.contentType)
      fd.append('description', form.description)
      fd.append('date', form.date)
      fd.append('location', form.location)
      fd.append('source', form.source)
      fd.append('tags', form.tags)

      if (form.contentType === 'photo' || form.contentType === 'video') {
        if (selectedAlbumId) fd.append('albumId', selectedAlbumId)
        fd.append('title', albumSearch || form.title)
      } else {
        fd.append('title', form.title)
      }

      files.forEach(f => fd.append('files', f))

      const { data } = await api.post('/admin/bulk-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress(e) {
          if (e.total) setProgress((e.loaded / e.total) * 100)
        }
      })
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Upload failed. Please try again.')
    } finally { setUploading(false) }
  }

  return (
    <div className="admin-bulk">
      <h1 className="display-font admin-title">Bulk Upload</h1>
      <p className="text-muted admin-sub">Upload many files at once to quickly populate the archive.</p>
      <hr className="gold-rule" />

      {result ? (
        <div className="result-card card">
          <div className="result-icon">✓</div>
          <h3>Upload Complete</h3>
          <p className="text-muted">{result.uploaded} file(s) uploaded successfully.</p>
          <button className="btn btn-primary" onClick={reset}>Upload More</button>
        </div>
      ) : (
        <form className="upload-form" onSubmit={handleUpload}>
          {/* Content type */}
          <div className="form-row">
            <div className="form-group">
              <label>Content Type</label>
              <select value={form.contentType} onChange={e => setField('contentType', e.target.value)} required>
                <option value="">Select type...</option>
                <option value="photo">Photos &amp; Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>
          </div>

          {/* Photo/Video metadata */}
          {(form.contentType === 'photo' || form.contentType === 'video') && (
            <div className="form-row">
              <div className="form-group flex-2">
                <label>Album</label>
                <div className={`combo-box${showAlbumDropdown ? ' open' : ''}`}>
                  <input type="text" value={albumSearch} placeholder="Type to create new or select existing..." autoComplete="off"
                    onFocus={() => setShowAlbumDropdown(true)} onChange={onAlbumInput} />
                  {showAlbumDropdown && (filteredAlbums.length > 0 || albumSearch) && (
                    <div className="combo-dropdown">
                      {albumSearch && !exactMatch && (
                        <div className="combo-option combo-new" onMouseDown={e => { e.preventDefault(); selectNewAlbum() }}>
                          <span className="combo-new-icon">＋</span>
                          Create new album: <strong>"{albumSearch}"</strong>
                        </div>
                      )}
                      {filteredAlbums.map(a => (
                        <div key={a.id} className={`combo-option${selectedAlbumId === a.id ? ' selected' : ''}`}
                          onMouseDown={e => { e.preventDefault(); selectExistingAlbum(a) }}>
                          <span className="combo-title">{a.title}</span>
                          <span className="combo-meta text-muted">{a.itemCount} items · {a.dateDisplay || 'No date'}</span>
                        </div>
                      ))}
                      {!filteredAlbums.length && !albumSearch && (
                        <div className="combo-empty text-muted">No albums yet — type a name to create one</div>
                      )}
                    </div>
                  )}
                </div>
                {selectedAlbumId && (
                  <div className="combo-selected-tag">
                    Adding to: <strong>{albumSearch}</strong>
                    <button type="button" className="combo-clear" onClick={clearAlbumSelection}>✕</button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Date / Era</label>
                <input type="text" value={form.date} onChange={e => setField('date', e.target.value)} placeholder="e.g. Summer 1985, 1940s" />
              </div>
            </div>
          )}

          {/* Document metadata */}
          {form.contentType === 'document' && (
            <div className="form-row">
              <div className="form-group flex-2">
                <label>Title (leave blank to use file names)</label>
                <input type="text" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Family Letters" />
              </div>
              <div className="form-group">
                <label>Date / Era</label>
                <input type="text" value={form.date} onChange={e => setField('date', e.target.value)} placeholder="e.g. Summer 1985, 1940s" />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-2">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows="2" placeholder="Optional description for the batch" />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Grandma's house" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Source</label>
              <input type="text" value={form.source} onChange={e => setField('source', e.target.value)} placeholder="e.g. Uncle Bob's attic" />
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input type="text" value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="e.g. reunion, birthday" />
            </div>
          </div>

          {/* File drop zone */}
          <div className="form-group">
            <label>Files ({files.length} selected)</label>
            <div className={`drop-zone${dragover ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" multiple className="hidden-input" onChange={onFileChange} />
              <div className="drop-content">
                <div className="drop-icon">📁</div>
                <p>Drag &amp; drop files here, or <span className="drop-link">click to browse</span></p>
                <p className="text-muted drop-hint">
                  {form.contentType === 'document' ? 'PDFs, images, scans' : 'Images and videos'} · No limit on number of files
                </p>
              </div>
            </div>
          </div>

          {/* File list preview */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map((f, i) => (
                <div key={`${f.name}-${f.size}-${f.lastModified}`} className="file-item">
                  <span className="file-icon">{f.type.startsWith('image/') ? '🖼️' : f.type.startsWith('video/') ? '🎬' : '📄'}</span>
                  <span className="file-name">{f.name}</span>
                  <span className="file-size text-muted">{formatSize(f.size)}</span>
                  <button type="button" className="file-remove" onClick={() => removeFile(i)}>✕</button>
                </div>
              ))}
              <div className="file-summary text-muted">{files.length} files · {formatSize(totalSize)} total</div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={uploading || !files.length || !form.contentType}>
              {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
