import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import PhotoGrid from '@/components/media/PhotoGrid'
import CommentSection from '@/components/common/CommentSection'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import './AlbumView.css'

export default function AlbumView() {
  const { id } = useParams()
  const auth = useAuthStore()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/media/albums/${id}`)
        setAlbum(data)
      } finally { setLoading(false) }
    })()
  }, [id])

  if (loading) return <div className="loading text-muted">Loading album...</div>
  if (!album) return null

  return (
    <div className="album-page">
      <div className="page-header">
        <Link to="/photos" className="back-link text-muted">← Albums</Link>
        <h1 className="display-font page-title">{album.title}</h1>
        <p className="text-muted album-meta-text">{album.dateDisplay} {album.location && `· ${album.location}`}</p>
        {album.description && <p className="album-desc text-muted">{album.description}</p>}
        {album.people?.length > 0 && (
          <div className="album-tags">{album.people.map(p => <span key={p} className="badge">{p}</span>)}</div>
        )}
        <hr className="gold-rule" />
      </div>
      <div className="album-content">
        <PhotoGrid items={album.items} />
        {auth.token ? (
          <CommentSection artifactId={album.id} artifactType="album" />
        ) : (
          <div className="comment-gate text-muted"><Link to="/login">Sign in</Link> to view and post comments.</div>
        )}
      </div>
    </div>
  )
}
