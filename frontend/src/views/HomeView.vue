<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <img src="/crest.png" alt="Wyatt Coat of Arms" class="hero-crest" />
      <h1 class="hero-title display-font">Wyatt Family</h1>
      <hr class="gold-rule hero-rule" />
      <p class="hero-tagline">Preserving Our History &nbsp;·&nbsp; Sharing Our Stories &nbsp;·&nbsp; alanwyatt.com</p>

      <div class="hero-search">
        <input v-model="query" placeholder="Search people, photos, stories, documents..." @keyup.enter="doSearch" />
        <button class="btn btn-primary" @click="doSearch">Search</button>
      </div>

      <div class="hero-stats">
        <div class="stat" v-for="s in stats" :key="s.label">
          <div class="stat-num">{{ s.value.toLocaleString() }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- Recent bar -->
    <div class="recent-bar">
      <span class="section-label">Recently Added</span>
      <span v-for="r in recent" :key="r.id" class="recent-item">
        <RouterLink :to="r.link" class="text-gold">{{ r.title }}</RouterLink>
        <span class="text-muted"> · {{ r.type }}</span>
      </span>
    </div>

    <div class="home-content">
      <!-- Recent photos -->
      <section class="home-section">
        <div class="section-header">
          <span class="section-label">Recent Photos &amp; Videos</span>
          <RouterLink to="/photos" class="view-all">View all →</RouterLink>
        </div>
        <PhotoGrid :items="recentMedia" />
      </section>

      <div class="two-col">
        <!-- Stories -->
        <section class="home-section">
          <div class="section-header">
            <span class="section-label">Latest Stories</span>
            <RouterLink to="/stories" class="view-all">View all →</RouterLink>
          </div>
          <div class="story-list">
            <div v-for="s in recentStories" :key="s.id" class="story-card card">
              <RouterLink :to="`/stories/${s.id}`">
                <span class="badge story-tag">{{ s.topic }}</span>
                <h3 class="story-title">{{ s.title }}</h3>
                <p class="text-muted story-meta">{{ s.dateDisplay }} · {{ s.people?.join(', ') }}</p>
                <p class="story-excerpt text-muted">{{ s.excerpt }}</p>
              </RouterLink>
            </div>
          </div>
        </section>

        <!-- Documents -->
        <section class="home-section">
          <div class="section-header">
            <span class="section-label">Recent Documents</span>
            <RouterLink to="/documents" class="view-all">View all →</RouterLink>
          </div>
          <div class="doc-list">
            <RouterLink v-for="d in recentDocs" :key="d.id" :to="`/documents?id=${d.id}`" class="doc-item card">
              <div class="doc-icon">{{ docIcon(d.type) }}</div>
              <div>
                <div class="doc-name">{{ d.title }}</div>
                <div class="doc-type text-muted">{{ d.type }} · {{ d.dateDisplay }}</div>
              </div>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PhotoGrid from '@/components/media/PhotoGrid.vue'
import api from '@/services/api'

const router       = useRouter()
const query        = ref('')
const recentMedia  = ref([])
const recentStories= ref([])
const recentDocs   = ref([])
const recent       = ref([])

const stats = ref([
  { value: 0, label: 'Photos' },
  { value: 0, label: 'Videos' },
  { value: 0, label: 'People' },
  { value: 0, label: 'Stories' },
  { value: 0, label: 'Documents' },
])

function doSearch() {
  if (query.value.trim()) router.push({ path: '/photos', query: { q: query.value } })
}

function docIcon(type) {
  const icons = { 'Birth Certificate': '📄', 'Letter': '✉️', 'Land Deed': '📜', 'Census Record': '📋', 'Military Record': '🎖️' }
  return icons[type] || '📄'
}

onMounted(async () => {
  try {
    const [mediaRes, storiesRes, docsRes, statsRes, recentRes] = await Promise.all([
      api.get('/media/recent?limit=8'),
      api.get('/stories?limit=3'),
      api.get('/documents?limit=5'),
      api.get('/stats'),
      api.get('/recent'),
    ])
    recentMedia.value   = mediaRes.data
    recentStories.value = storiesRes.data
    recentDocs.value    = docsRes.data
    recent.value        = recentRes.data
    stats.value[0].value = statsRes.data.photos
    stats.value[1].value = statsRes.data.videos
    stats.value[2].value = statsRes.data.people
    stats.value[3].value = statsRes.data.stories
    stats.value[4].value = statsRes.data.documents
  } catch (e) {
    console.error('Home data load failed', e)
  }
})
</script>

<style scoped>
.hero {
  background: var(--color-bg);
  padding: 3rem 2rem 2.5rem;
  text-align: center;
  border-bottom: 1px solid var(--color-border-gold);
}
.hero-crest {
  width: 110px;
  height: 110px;
  object-fit: contain;
  filter: drop-shadow(0 0 14px rgba(201,168,76,0.35));
  margin-bottom: 1rem;
}
.hero-title {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 8px;
}
.hero-rule { width: 140px; margin: 10px auto; }
.hero-tagline {
  color: var(--color-gold-dark);
  font-size: 11px;
  letter-spacing: 2px;
  margin-bottom: 1.75rem;
}
.hero-search {
  display: flex;
  max-width: 480px;
  margin: 0 auto 1.75rem;
  border: 1px solid var(--color-border-gold);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.hero-search input {
  border: none;
  border-radius: 0;
  flex: 1;
}
.hero-search .btn { border-radius: 0; padding: 9px 20px; }

.hero-stats {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.stat {
  padding: 0 24px;
  border-right: 1px solid var(--color-border-gold);
  text-align: center;
}
.stat:last-child { border-right: none; }
.stat-num   { font-size: 22px; font-weight: 500; color: var(--color-gold); }
.stat-label { font-size: 9px;  letter-spacing: 2px; color: var(--color-gold-dark); }

.recent-bar {
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 8px 2rem;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
}
.recent-item { display: flex; gap: 4px; }

.home-content { padding: 2rem; }
.home-section { margin-bottom: 2.5rem; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}
.view-all { font-size: 11px; color: var(--color-gold-dark); }
.view-all:hover { color: var(--color-gold); }

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* Stories */
.story-list { display: flex; flex-direction: column; gap: 10px; }
.story-card { padding: 14px; }
.story-card a { text-decoration: none; color: inherit; }
.story-tag   { margin-bottom: 6px; }
.story-title { font-size: 14px; margin-bottom: 4px; }
.story-meta  { font-size: 11px; margin-bottom: 6px; }
.story-excerpt { font-size: 12px; line-height: 1.5; }

/* Documents */
.doc-list { display: flex; flex-direction: column; gap: 8px; }
.doc-item  { display: flex; align-items: center; gap: 12px; padding: 10px 14px; text-decoration: none; color: inherit; }
.doc-item:hover { border-color: var(--color-gold-dark); }
.doc-icon  { width: 32px; height: 32px; background: var(--color-gold-subtle); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.doc-name  { font-size: 13px; }
.doc-type  { font-size: 11px; }

@media (max-width: 768px) {
  .hero-title { font-size: 36px; }
  .two-col { grid-template-columns: 1fr; }
  .hero-crest { width: 80px; height: 80px; }
}
</style>
