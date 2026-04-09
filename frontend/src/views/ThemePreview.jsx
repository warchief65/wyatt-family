import { useState, useMemo } from 'react'
import './ThemePreview.css'

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
      '--color-bg':'#000000','--color-bg-surface':'#111111','--color-bg-card':'#1A1A1A','--color-bg-input':'#0D0D0D',
      '--color-gold':'#D4B85C','--color-gold-soft':'#EDD48A','--color-gold-dark':'#A88A38','--color-gold-deep':'#2A1F00','--color-gold-subtle':'#1E1600',
      '--color-text':'#F5F5F5','--color-text-muted':'#B0B0B0','--color-text-faint':'#666666',
      '--color-border':'#2A2200','--color-border-gold':'#8A7030','--color-border-glow':'#4A3A00',
      '--color-accent':'#D4B85C','--color-footer-bg':'#050505','--color-nav-bg':'#000000',
      '--color-sparkle':'rgba(201,168,76,0.6)','--crest-shadow':'rgba(201,168,76,0.45)',
    }
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    description: 'Built from your five-swatch palette — deep indigo to pale lavender with warm heraldic gold from the crest mantling. The crest sits naturally in its own blue family.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':'#1E1C80','--color-bg-surface':'#282698','--color-bg-card':'#3230A8','--color-bg-input':'#161470',
      '--color-gold':'#D4AA30','--color-gold-soft':'#E8C44E','--color-gold-dark':'#AA8820','--color-gold-deep':'#2826A0','--color-gold-subtle':'#222090',
      '--color-text':'#EEEAF6','--color-text-muted':'#B0B0DA','--color-text-faint':'#7878BC',
      '--color-border':'#3C3AAC','--color-border-gold':'#5454BE','--color-border-glow':'#4846B4',
      '--color-accent':'#2E24B0','--color-footer-bg':'#161468','--color-nav-bg':'#1E1C80',
      '--color-sparkle':'rgba(212,170,48,0.6)','--crest-shadow':'rgba(212,170,48,0.4)',
    }
  },
  {
    id: 'manor-slate',
    name: 'Manor Slate',
    description: 'Cool blue-gray tones reminiscent of English stone manors, paired with warm ivory text and soft gold accents. A refined, airy palette that gives the crest a stately, distinguished setting.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':'#2E3A4C','--color-bg-surface':'#38465A','--color-bg-card':'#425068','--color-bg-input':'#283448',
      '--color-gold':'#C9A84C','--color-gold-soft':'#DDBF6A','--color-gold-dark':'#9A7E30','--color-gold-deep':'#3A4858','--color-gold-subtle':'#344252',
      '--color-text':'#F0ECE4','--color-text-muted':'#B4BAC4','--color-text-faint':'#7E8C9C',
      '--color-border':'#4C5A6E','--color-border-gold':'#6A7A8E','--color-border-glow':'#586878',
      '--color-accent':'#5A8AAC','--color-footer-bg':'#242E3E','--color-nav-bg':'#2E3A4C',
      '--color-sparkle':'rgba(201,168,76,0.5)','--crest-shadow':'rgba(201,168,76,0.3)',
    }
  },
  {
    id: 'steel-teal',
    name: 'Steel Teal',
    description: 'Cool steel-blue and teal tones — like weathered slate rooftops and coastal skies over Kent. Muted and sophisticated, with warm gold from your crest cutting through the cool palette.',
    font: "'Quintessential', 'Times New Roman', serif",
    vars: {
      '--color-bg':'#1C2C3A','--color-bg-surface':'#2A3E4C','--color-bg-card':'#344A58','--color-bg-input':'#182834',
      '--color-gold':'#D4B85C','--color-gold-soft':'#EDD48A','--color-gold-dark':'#A88A38','--color-gold-deep':'#2E4250','--color-gold-subtle':'#283C48',
      '--color-text':'#E4E8EC','--color-text-muted':'#AABCC8','--color-text-faint':'#6A8A9A',
      '--color-border':'#3C4C54','--color-border-gold':'#5A8CA0','--color-border-glow':'#4A6E80',
      '--color-accent':'#5A8CA0','--color-footer-bg':'#141E28','--color-nav-bg':'#1C2C3A',
      '--color-sparkle':'rgba(212,184,92,0.5)','--crest-shadow':'rgba(90,140,160,0.35)',
    }
  },
  {
    id: 'parchment',
    name: 'Parchment Heritage',
    description: 'Warm cream and aged parchment with rich wood-brown accents — like opening a leather-bound family Bible. A light theme that feels antique and inviting, letting photos and documents take center stage.',
    font: "'Playfair Display', 'Georgia', serif",
    vars: {
      '--color-bg':'#f4e9d8','--color-bg-surface':'#efe2ce','--color-bg-card':'#fff8ec','--color-bg-input':'#fdf7ec',
      '--color-gold':'#6b4c2e','--color-gold-soft':'#8a6840','--color-gold-dark':'#4b3b2a','--color-gold-deep':'#f0e4d0','--color-gold-subtle':'#e8dcc7',
      '--color-text':'#4b3b2a','--color-text-muted':'#6e5c45','--color-text-faint':'#7a6a55',
      '--color-border':'#d6c3a3','--color-border-gold':'#cbb89a','--color-border-glow':'#b89b6d',
      '--color-accent':'#6b4c2e','--color-footer-bg':'#ece0cc','--color-nav-bg':'#f4e9d8',
      '--color-sparkle':'rgba(107,76,46,0.4)','--crest-shadow':'rgba(107,76,46,0.25)',
    }
  },
]

export default function ThemePreview() {
  const [active, setActive] = useState('current')

  const currentTheme = useMemo(() => themes.find(t => t.id === active), [active])
  const displayFont = currentTheme.font
  const isParchment = active === 'parchment'
  const themeVars = currentTheme.vars

  function chipStyle(t) {
    return { background: t.vars['--color-bg'], color: t.vars['--color-text'], borderColor: t.vars['--color-border-gold'] }
  }

  return (
    <div className="theme-preview-page">
      <div className="picker-bar">
        <h2 className="picker-title">Theme Preview</h2>
        <p className="picker-subtitle">Click a theme to preview the front page. Your crest is preserved in all options.</p>
        <div className="picker-chips">
          {themes.map(t => (
            <button key={t.id} className={`chip${active === t.id ? ' active' : ''}`} style={chipStyle(t)} onClick={() => setActive(t.id)}>
              <span className="chip-swatch" style={{ background: t.vars['--color-gold'] }} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview pane */}
      <div className={`preview-frame${isParchment ? ' parchment-texture' : ''}`} style={themeVars}>
        {/* Nav */}
        <nav className="pv-nav">
          <div className="pv-brand">
            <img src="/crest.png" alt="Wyatt Crest" className="pv-nav-crest" />
            <span className="pv-brand-name" style={{ fontFamily: displayFont }}>Wyatt</span>
          </div>
          <div className="pv-nav-links">
            <span>Photos &amp; Videos</span><span>Family Tree</span><span>Documents</span><span>Stories</span>
          </div>
          <div className="pv-nav-right">
            <span className="pv-btn-secondary">Sign In</span>
            <span className="pv-btn-primary">Join</span>
          </div>
        </nav>

        {/* Hero */}
        <section className="pv-hero">
          <div className="pv-hero-inner">
            <div className="pv-crest-wrapper">
              <img src="/crest.png" alt="Wyatt Coat of Arms" className="pv-hero-crest" />
              <span className="pv-sparkle s1" /><span className="pv-sparkle s2" />
              <span className="pv-sparkle s3" /><span className="pv-sparkle s4" />
            </div>
            <div className="pv-hero-text">
              <h1 className="pv-hero-title" style={{ fontFamily: displayFont }}>Wyatt Family</h1>
              <p className="pv-tagline">Preserving Our History &nbsp;·&nbsp; Sharing Our Stories &nbsp;·&nbsp; alanwyatt.com</p>
              <div className="pv-search">
                <input placeholder="Search people, photos, stories, documents..." disabled />
                <span className="pv-search-btn">Search</span>
              </div>
              <div className="pv-stats">
                {sampleStats.map(s => (
                  <div key={s.label} className="pv-stat">
                    <div className="pv-stat-num">{s.value}</div>
                    <div className="pv-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recent bar */}
        <div className="pv-recent-bar">
          <span className="pv-section-label">Recently Added</span>
          <span className="pv-recent-item"><span className="pv-link">Wyatt Family Reunion 2024</span> · Photos</span>
          <span className="pv-recent-item"><span className="pv-link">Margaret Wyatt Birth Cert</span> · Document</span>
          <span className="pv-recent-item"><span className="pv-link">The Kent Years</span> · Story</span>
        </div>

        {/* Content */}
        <div className="pv-content">
          <div className="pv-section-header">
            <span className="pv-section-label">Recent Photos &amp; Videos</span>
            <span className="pv-view-all">View all →</span>
          </div>
          <div className="pv-photo-grid">
            {[1,2,3,4].map(n => <div key={n} className="pv-photo-placeholder"><span className="pv-photo-icon">📷</span></div>)}
          </div>

          <div className="pv-two-col">
            <div>
              <div className="pv-section-header">
                <span className="pv-section-label">Latest Stories</span>
                <span className="pv-view-all">View all →</span>
              </div>
              {[1,2].map(n => (
                <div key={n} className="pv-card">
                  <span className="pv-badge">Family Lore</span>
                  <div className="pv-card-title">A Story from the Wyatt Archives</div>
                  <div className="pv-card-meta">June 1952 · William Wyatt</div>
                </div>
              ))}
            </div>
            <div>
              <div className="pv-section-header">
                <span className="pv-section-label">Recent Documents</span>
                <span className="pv-view-all">View all →</span>
              </div>
              {[1,2,3].map(n => (
                <div key={n} className="pv-doc-item">
                  <span className="pv-doc-icon">📄</span>
                  <div>
                    <div className="pv-doc-name">Historical Document</div>
                    <div className="pv-doc-type">Birth Certificate · 1923</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pv-footer">
          <div className="pv-footer-brand">
            <img src="/crest.png" alt="Wyatt Crest" className="pv-footer-crest" />
            <div>
              <div className="pv-footer-name" style={{ fontFamily: displayFont }}>Wyatt Family</div>
              <div className="pv-footer-url">alanwyatt.com</div>
            </div>
          </div>
          <div className="pv-footer-links">
            <span>Photos</span><span>Family Tree</span><span>Documents</span><span>Stories</span>
          </div>
          <div className="pv-footer-right">
            <span className="pv-btn-secondary">♥ Support This Site</span>
            <div className="pv-footer-copy">© 2025 Alan Wyatt · alanwyatt.com</div>
          </div>
        </footer>
      </div>

      {/* Theme description */}
      <div className="theme-description">
        <h3>{currentTheme.name}</h3>
        <p>{currentTheme.description}</p>
      </div>
    </div>
  )
}
