<template>
  <div class="theme-preview-page">
    <div class="picker-bar">
      <h2 class="picker-title">Theme Preview</h2>
      <p class="picker-subtitle">Click a theme to preview the front page. Your crest is preserved in all options.</p>
      <div class="picker-chips">
        <button
          v-for="t in themes"
          :key="t.id"
          :class="['chip', { active: active === t.id }]"
          :style="chipStyle(t)"
          @click="active = t.id"
        >
          <span class="chip-swatch" :style="{ background: t.vars['--color-gold'] }" />
          {{ t.name }}
        </button>
      </div>
    </div>

    <!-- Live preview pane -->
    <div class="preview-frame" :class="{ 'parchment-texture': isParchment }" :style="themeVars">
      <!-- Nav preview -->
      <nav class="pv-nav">
        <div class="pv-brand">
          <img src="/crest.png" alt="Wyatt Crest" class="pv-nav-crest">
          <span class="pv-brand-name" :style="{ fontFamily: displayFont }">Wyatt</span>
        </div>
        <div class="pv-nav-links">
          <span>Photos &amp; Videos</span>
          <span>Family Tree</span>
          <span>Documents</span>
          <span>Stories</span>
        </div>
        <div class="pv-nav-right">
          <span class="pv-btn-secondary">Sign In</span>
          <span class="pv-btn-primary">Join</span>
        </div>
      </nav>

      <!-- Hero preview -->
      <section class="pv-hero">
        <div class="pv-hero-inner">
          <div class="pv-crest-wrapper">
            <img src="/crest.png" alt="Wyatt Coat of Arms" class="pv-hero-crest">
            <span class="pv-sparkle s1" />
            <span class="pv-sparkle s2" />
            <span class="pv-sparkle s3" />
            <span class="pv-sparkle s4" />
          </div>
          <div class="pv-hero-text">
            <h1 class="pv-hero-title" :style="{ fontFamily: displayFont }">Wyatt Family</h1>
            <p class="pv-tagline">Preserving Our History &nbsp;·&nbsp; Sharing Our Stories &nbsp;·&nbsp; alanwyatt.com</p>

            <div class="pv-search">
              <input placeholder="Search people, photos, stories, documents..." disabled>
              <span class="pv-search-btn">Search</span>
            </div>

            <div class="pv-stats">
              <div class="pv-stat" v-for="s in sampleStats" :key="s.label">
                <div class="pv-stat-num">{{ s.value }}</div>
                <div class="pv-stat-label">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent bar preview -->
      <div class="pv-recent-bar">
        <span class="pv-section-label">Recently Added</span>
        <span class="pv-recent-item"><span class="pv-link">Wyatt Family Reunion 2024</span> · Photos</span>
        <span class="pv-recent-item"><span class="pv-link">Margaret Wyatt Birth Cert</span> · Document</span>
        <span class="pv-recent-item"><span class="pv-link">The Kent Years</span> · Story</span>
      </div>

      <!-- Content area preview -->
      <div class="pv-content">
        <div class="pv-section-header">
          <span class="pv-section-label">Recent Photos &amp; Videos</span>
          <span class="pv-view-all">View all →</span>
        </div>
        <div class="pv-photo-grid">
          <div class="pv-photo-placeholder" v-for="n in 4" :key="n">
            <span class="pv-photo-icon">📷</span>
          </div>
        </div>

        <div class="pv-two-col">
          <div>
            <div class="pv-section-header">
              <span class="pv-section-label">Latest Stories</span>
              <span class="pv-view-all">View all →</span>
            </div>
            <div class="pv-card" v-for="n in 2" :key="'s'+n">
              <span class="pv-badge">Family Lore</span>
              <div class="pv-card-title">A Story from the Wyatt Archives</div>
              <div class="pv-card-meta">June 1952 · William Wyatt</div>
            </div>
          </div>
          <div>
            <div class="pv-section-header">
              <span class="pv-section-label">Recent Documents</span>
              <span class="pv-view-all">View all →</span>
            </div>
            <div class="pv-doc-item" v-for="n in 3" :key="'d'+n">
              <span class="pv-doc-icon">📄</span>
              <div>
                <div class="pv-doc-name">Historical Document</div>
                <div class="pv-doc-type">Birth Certificate · 1923</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer preview -->
      <footer class="pv-footer">
        <div class="pv-footer-brand">
          <img src="/crest.png" alt="Wyatt Crest" class="pv-footer-crest">
          <div>
            <div class="pv-footer-name" :style="{ fontFamily: displayFont }">Wyatt Family</div>
            <div class="pv-footer-url">alanwyatt.com</div>
          </div>
        </div>
        <div class="pv-footer-links">
          <span>Photos</span><span>Family Tree</span><span>Documents</span><span>Stories</span>
        </div>
        <div class="pv-footer-right">
          <span class="pv-btn-secondary">♥ Support This Site</span>
          <div class="pv-footer-copy">© 2025 Alan Wyatt · alanwyatt.com</div>
        </div>
      </footer>
    </div>

    <!-- Theme description -->
    <div class="theme-description">
      <h3>{{ currentTheme.name }}</h3>
      <p>{{ currentTheme.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const sampleStats = [
  { value: '1,247', label: 'Photos' },
  { value: '38', label: 'Videos' },
  { value: '312', label: 'People' },
  { value: '45', label: 'Stories' },
  { value: '89', label: 'Documents' },
]

const themes = [
  {
    id: 'current',
    name: 'Current (Black & Gold)',
    description: 'Your existing theme — pure black background with warm gold accents. Gothic and dramatic, but the high contrast can feel heavy over long reading sessions.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':           '#000000',
      '--color-bg-surface':   '#111111',
      '--color-bg-card':      '#1A1A1A',
      '--color-bg-input':     '#0D0D0D',
      '--color-gold':         '#D4B85C',
      '--color-gold-soft':    '#EDD48A',
      '--color-gold-dark':    '#A88A38',
      '--color-gold-deep':    '#2A1F00',
      '--color-gold-subtle':  '#1E1600',
      '--color-text':         '#F5F5F5',
      '--color-text-muted':   '#B0B0B0',
      '--color-text-faint':   '#666666',
      '--color-border':       '#2A2200',
      '--color-border-gold':  '#8A7030',
      '--color-border-glow':  '#4A3A00',
      '--color-accent':       '#D4B85C',
      '--color-footer-bg':    '#050505',
      '--color-nav-bg':       '#000000',
      '--color-sparkle':      'rgba(201,168,76,0.6)',
      '--crest-shadow':       'rgba(201,168,76,0.45)',
    }
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    description: 'Built from your five-swatch palette — deep indigo to pale lavender with warm heraldic gold from the crest mantling. The crest sits naturally in its own blue family.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':           '#1E1C80',
      '--color-bg-surface':   '#282698',
      '--color-bg-card':      '#3230A8',
      '--color-bg-input':     '#161470',
      '--color-gold':         '#D4AA30',
      '--color-gold-soft':    '#E8C44E',
      '--color-gold-dark':    '#AA8820',
      '--color-gold-deep':    '#2826A0',
      '--color-gold-subtle':  '#222090',
      '--color-text':         '#EEEAF6',
      '--color-text-muted':   '#B0B0DA',
      '--color-text-faint':   '#7878BC',
      '--color-border':       '#3C3AAC',
      '--color-border-gold':  '#5454BE',
      '--color-border-glow':  '#4846B4',
      '--color-accent':       '#2E24B0',
      '--color-footer-bg':    '#161468',
      '--color-nav-bg':       '#1E1C80',
      '--color-sparkle':      'rgba(212,170,48,0.6)',
      '--crest-shadow':       'rgba(212,170,48,0.4)',
    }
  },
  {
    id: 'manor-slate',
    name: 'Manor Slate',
    description: 'Cool blue-gray tones reminiscent of English stone manors, paired with warm ivory text and soft gold accents. A refined, airy palette that gives the crest a stately, distinguished setting.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':           '#2E3A4C',
      '--color-bg-surface':   '#38465A',
      '--color-bg-card':      '#425068',
      '--color-bg-input':     '#283448',
      '--color-gold':         '#C9A84C',
      '--color-gold-soft':    '#DDBF6A',
      '--color-gold-dark':    '#9A7E30',
      '--color-gold-deep':    '#3A4858',
      '--color-gold-subtle':  '#344252',
      '--color-text':         '#F0ECE4',
      '--color-text-muted':   '#B4BAC4',
      '--color-text-faint':   '#7E8C9C',
      '--color-border':       '#4C5A6E',
      '--color-border-gold':  '#6A7A8E',
      '--color-border-glow':  '#586878',
      '--color-accent':       '#5A8AAC',
      '--color-footer-bg':    '#242E3E',
      '--color-nav-bg':       '#2E3A4C',
      '--color-sparkle':      'rgba(201,168,76,0.5)',
      '--crest-shadow':       'rgba(201,168,76,0.3)',
    }
  },
  {
    id: 'steel-teal',
    name: 'Steel Teal',
    description: 'Cool steel-blue and teal tones — like weathered slate rooftops and coastal skies over Kent. Muted and sophisticated, with warm gold from your crest cutting through the cool palette.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':           '#1C2C3A',
      '--color-bg-surface':   '#2A3E4C',
      '--color-bg-card':      '#344A58',
      '--color-bg-input':     '#182834',
      '--color-gold':         '#D4B85C',
      '--color-gold-soft':    '#EDD48A',
      '--color-gold-dark':    '#A88A38',
      '--color-gold-deep':    '#2E4250',
      '--color-gold-subtle':  '#283C48',
      '--color-text':         '#E4E8EC',
      '--color-text-muted':   '#AABCC8',
      '--color-text-faint':   '#6A8A9A',
      '--color-border':       '#3C4C54',
      '--color-border-gold':  '#5A8CA0',
      '--color-border-glow':  '#4A6E80',
      '--color-accent':       '#5A8CA0',
      '--color-footer-bg':    '#141E28',
      '--color-nav-bg':       '#1C2C3A',
      '--color-sparkle':      'rgba(212,184,92,0.5)',
      '--crest-shadow':       'rgba(90,140,160,0.35)',
    }
  },
  {
    id: 'parchment',
    name: 'Parchment Heritage',
    description: 'Warm cream and aged parchment with rich wood-brown accents — like opening a leather-bound family Bible. A light theme that feels antique and inviting, letting photos and documents take center stage.',
    font: "'Playfair Display', 'Georgia', serif",
    vars: {
      '--color-bg':           '#f4e9d8',
      '--color-bg-surface':   '#efe2ce',
      '--color-bg-card':      '#fff8ec',
      '--color-bg-input':     '#fdf7ec',
      '--color-gold':         '#6b4c2e',
      '--color-gold-soft':    '#8a6840',
      '--color-gold-dark':    '#4b3b2a',
      '--color-gold-deep':    '#f0e4d0',
      '--color-gold-subtle':  '#e8dcc7',
      '--color-text':         '#4b3b2a',
      '--color-text-muted':   '#6e5c45',
      '--color-text-faint':   '#7a6a55',
      '--color-border':       '#d6c3a3',
      '--color-border-gold':  '#cbb89a',
      '--color-border-glow':  '#b89b6d',
      '--color-accent':       '#6b4c2e',
      '--color-footer-bg':    '#ece0cc',
      '--color-nav-bg':       '#f4e9d8',
      '--color-sparkle':      'rgba(107,76,46,0.4)',
      '--crest-shadow':       'rgba(107,76,46,0.25)',
    }
  },
]

const active = ref('current')

const currentTheme = computed(() => themes.find(t => t.id === active.value))

const displayFont = computed(() => currentTheme.value.font)

const isParchment = computed(() => active.value === 'parchment')

const themeVars = computed(() => {
  const vars = currentTheme.value.vars
  return Object.fromEntries(Object.entries(vars))
})

function chipStyle(t) {
  return {
    background: t.vars['--color-bg'],
    color: t.vars['--color-text'],
    borderColor: t.vars['--color-border-gold'],
  }
}
</script>

<style scoped>
/* Picker bar (always outside the themed preview) */
.theme-preview-page {
  background: #111;
  min-height: 100vh;
}

.picker-bar {
  background: #0a0a0a;
  padding: 2rem 2rem 1.5rem;
  text-align: center;
  border-bottom: 1px solid #333;
}
.picker-title {
  font-family: 'Quintessential', serif;
  color: #D4B85C;
  font-size: 28px;
  margin-bottom: 4px;
}
.picker-subtitle {
  color: #888;
  font-size: 13px;
  margin-bottom: 1.25rem;
}
.picker-chips {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}
.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: 2px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.chip:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.chip.active { outline: 3px solid #D4B85C; outline-offset: 2px; transform: translateY(-2px); }
.chip-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.15);
}

/* Theme description */
.theme-description {
  padding: 2rem;
  text-align: center;
}
.theme-description h3 {
  font-family: 'Quintessential', serif;
  color: #D4B85C;
  font-size: 22px;
  margin-bottom: 8px;
}
.theme-description p {
  color: #999;
  font-size: 14px;
  max-width: 640px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ── Preview Frame ─────────────────────────── */
.preview-frame {
  margin: 2rem;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.6;
}

/* Nav */
.pv-nav {
  background: var(--color-nav-bg);
  border-bottom: 1px solid var(--color-border-gold);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 52px;
}
.pv-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pv-nav-crest { width: 28px; height: 28px; object-fit: contain; }
.pv-brand-name { font-size: 22px; color: var(--color-gold); }
.pv-nav-links {
  display: flex;
  gap: 24px;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}
.pv-nav-links span { cursor: default; }
.pv-nav-links span:hover { color: var(--color-gold); }
.pv-nav-right { display: flex; gap: 8px; }
.pv-btn-primary {
  background: var(--color-gold);
  color: var(--color-bg);
  border: 1px solid var(--color-gold);
  padding: 5px 14px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  cursor: default;
}
.pv-btn-secondary {
  background: transparent;
  color: var(--color-gold);
  border: 1px solid var(--color-gold);
  padding: 5px 14px;
  border-radius: 3px;
  font-size: 11px;
  cursor: default;
}

/* Hero */
.pv-hero {
  background: var(--color-bg);
  padding: 2.5rem 2rem 2rem;
  border-bottom: 1px solid var(--color-border-gold);
}
.pv-hero-inner {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  max-width: 720px;
  margin: 0 auto;
}
.pv-crest-wrapper {
  position: relative;
  flex-shrink: 0;
}
.pv-hero-crest {
  width: 200px;
  height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 0 20px var(--crest-shadow));
}
.pv-hero-text {
  flex: 1;
}

/* Sparkles */
.pv-sparkle {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, var(--color-sparkle) 40%, transparent 70%);
  box-shadow: 0 0 5px 2px var(--color-sparkle);
  opacity: 0;
  pointer-events: none;
  animation: pv-sparkle-pop 2.4s ease-in-out infinite;
}
.pv-sparkle.s1 { top: 10%; left: 10%; animation-delay: 0s; }
.pv-sparkle.s2 { top: 8%;  right: 14%; animation-delay: 0.6s; }
.pv-sparkle.s3 { top: 50%; left: -2%;  animation-delay: 1.2s; }
.pv-sparkle.s4 { bottom: 20%; right: 6%; animation-delay: 1.8s; }

@keyframes pv-sparkle-pop {
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  15%      { opacity: 1; transform: scale(1.2) rotate(30deg); }
  30%      { opacity: 1; transform: scale(1) rotate(60deg); }
  50%      { opacity: 0.5; transform: scale(0.8) rotate(120deg); }
  70%      { opacity: 0; transform: scale(0) rotate(180deg); }
}

.pv-hero-title {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 6px;
  color: var(--color-gold);
}
.pv-tagline {
  color: var(--color-text-faint);
  font-size: 10px;
  letter-spacing: 2px;
  margin-bottom: 1.25rem;
}

.pv-search {
  display: flex;
  max-width: 400px;
  margin: 0 0 1.25rem;
  border: 1px solid var(--color-border-gold);
  border-radius: 3px;
  overflow: hidden;
}
.pv-search input {
  border: none;
  flex: 1;
  background: var(--color-bg-input);
  color: var(--color-text);
  font-size: 14px;
  padding: 9px 14px;
  outline: none;
  font-family: inherit;
}
.pv-search input::placeholder { color: var(--color-text-faint); }
.pv-search-btn {
  background: var(--color-gold);
  color: var(--color-bg);
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: default;
}

.pv-stats {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}
.pv-stat {
  padding: 0 20px;
  border-right: 1px solid var(--color-border-gold);
  text-align: center;
}
.pv-stat:last-child { border-right: none; }
.pv-stat-num   { font-size: 20px; font-weight: 500; color: var(--color-gold); }
.pv-stat-label { font-size: 9px; letter-spacing: 2px; color: var(--color-text-faint); text-transform: uppercase; }

/* Recent bar */
.pv-recent-bar {
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 8px 2rem;
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--color-text-muted);
}
.pv-recent-item { display: flex; gap: 4px; }
.pv-link { color: var(--color-gold); }

/* Content */
.pv-content { padding: 1.5rem 2rem 2rem; }
.pv-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 6px;
}
.pv-section-label {
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--color-gold);
  text-transform: uppercase;
}
.pv-view-all { font-size: 10px; color: var(--color-text-faint); }

.pv-photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 1.5rem;
}
.pv-photo-placeholder {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pv-photo-icon { font-size: 24px; opacity: 0.3; }

.pv-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.pv-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
}
.pv-badge {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--color-gold-subtle);
  color: var(--color-gold);
  margin-bottom: 6px;
}
.pv-card-title { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
.pv-card-meta  { font-size: 10px; color: var(--color-text-faint); }

.pv-doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 10px 12px;
  margin-bottom: 6px;
}
.pv-doc-icon {
  width: 28px;
  height: 28px;
  background: var(--color-gold-subtle);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}
.pv-doc-name { font-size: 12px; }
.pv-doc-type { font-size: 10px; color: var(--color-text-faint); }

/* Card & doc hover states */
.pv-card,
.pv-doc-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.pv-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.pv-doc-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}

/* Parchment paper texture */
.parchment-texture {
  background-image: url("/parchment-bg.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

/* Footer */
.pv-footer {
  background: var(--color-footer-bg);
  border-top: 1px solid var(--color-border-gold);
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.pv-footer-brand { display: flex; align-items: center; gap: 10px; }
.pv-footer-crest { width: 32px; height: 32px; object-fit: contain; opacity: 0.7; }
.pv-footer-name  { font-size: 18px; color: var(--color-gold); }
.pv-footer-url   { font-size: 9px; color: var(--color-text-faint); letter-spacing: 1px; }
.pv-footer-links {
  display: flex;
  gap: 18px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.pv-footer-right { text-align: right; }
.pv-footer-copy  { font-size: 10px; color: var(--color-text-faint); margin-top: 6px; }

@media (max-width: 768px) {
  .preview-frame { margin: 1rem; }
  .pv-hero-inner { flex-direction: column; text-align: center; }
  .pv-hero-text { text-align: center; }
  .pv-search { margin: 0 auto 1.25rem; }
  .pv-stats { justify-content: center; }
  .pv-hero-title { font-size: 32px; }
  .pv-hero-crest { width: 140px; height: 140px; }
  .pv-photo-grid { grid-template-columns: repeat(2, 1fr); }
  .pv-two-col    { grid-template-columns: 1fr; }
  .pv-nav-links  { display: none; }
  .pv-footer {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
