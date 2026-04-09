import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import CommentSection from '@/components/common/CommentSection'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import './StoryView.css'

export default function StoryView() {
  const { id } = useParams()
  const { user, token } = useAuthStore()
  const isLoggedIn = !!token
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/stories/${id}`)
      .then(({ data }) => setStory(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading text-muted">Loading story...</div>
  if (!story) return null

  return (
    <div className="story-page">
      <div className="page-header">
        <Link to="/stories" className="back-link text-muted">← Stories</Link>
        {story.topic && <span className="badge story-topic">{story.topic}</span>}
        <h1 className="display-font story-title">{story.title}</h1>
        <div className="story-meta">
          {story.dateDisplay && <span className="text-muted">{story.dateDisplay}</span>}
          {story.people?.length > 0 && <span className="text-muted"> · {story.people.map(p => p.name).join(', ')}</span>}
        </div>
        <hr className="gold-rule" />
      </div>

      <article className="story-body" dangerouslySetInnerHTML={{ __html: story.body }} />

      <div className="story-footer">
        {story.people?.length > 0 && (
          <div className="tagged-people">
            <span className="section-label">People in this story</span>
            <div className="people-chips">
              {story.people.map(p => (
                <Link key={p.id} to={`/tree?person=${p.id}`} className="person-chip">{p.name}</Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="story-comments">
        {isLoggedIn ? (
          <CommentSection artifactId={story.id} artifactType="story" />
        ) : (
          <div className="comment-gate text-muted">
            <Link to="/login">Sign in</Link> to view and post comments.
          </div>
        )}
      </div>
    </div>
  )
}
