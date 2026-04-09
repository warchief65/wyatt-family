import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import './FamilyTreeView.css'

export default function FamilyTreeView() {
  const [searchParams] = useSearchParams()
  const auth = useAuthStore()
  const [allPeople, setAllPeople] = useState([])
  const [nodes, setNodes] = useState([])
  const [lines, setLines] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [scale, setScale] = useState(1)
  const [svgWidth, setSvgWidth] = useState(2000)
  const [svgHeight, setSvgHeight] = useState(1500)

  function initials(name) { return (name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() }
  function zoom(delta) { setScale(s => Math.max(0.3, Math.min(2, s + delta))) }
  function resetView() { setScale(1) }

  function layoutNodes(people) {
    const nodeSize = { w: 130, h: 80 }; const gap = { x: 20, y: 120 }
    const ids = new Set(people.map(p => p.id))
    function getGen(p, memo = new Map()) {
      if (memo.has(p.id)) return memo.get(p.id)
      const hasFather = p.fatherId && ids.has(p.fatherId)
      const hasMother = p.motherId && ids.has(p.motherId)
      if (!hasFather && !hasMother) { memo.set(p.id, 0); return 0 }
      const fatherGen = hasFather ? getGen(people.find(x => x.id === p.fatherId), memo) : -1
      const motherGen = hasMother ? getGen(people.find(x => x.id === p.motherId), memo) : -1
      const g = Math.max(fatherGen, motherGen) + 1; memo.set(p.id, g); return g
    }
    const genMap = new Map()
    people.forEach(p => { const g = getGen(p); if (!genMap.has(g)) genMap.set(g, []); genMap.get(g).push(p) })
    const result = []
    genMap.forEach((members, gen) => {
      members.forEach((p, i) => {
        const x = i * (nodeSize.w + gap.x) + 20; const y = gen * (nodeSize.h + gap.y) + 20
        result.push({ ...p, x, y })
      })
    })
    setSvgWidth(Math.max(2000, result.reduce((m, n) => Math.max(m, n.x + 200), 0)))
    setSvgHeight(Math.max(1500, result.reduce((m, n) => Math.max(m, n.y + 200), 0)))
    return result
  }

  function buildLines(nodes) {
    const ls = []; const nodeMap = new Map(nodes.map(n => [n.id, n]))
    nodes.forEach(n => {
      if (n.fatherId && nodeMap.has(n.fatherId)) { const f = nodeMap.get(n.fatherId); ls.push({ id: `f${n.id}`, x1: f.x + 65, y1: f.y + 80, x2: n.x + 65, y2: n.y }) }
      if (n.motherId && nodeMap.has(n.motherId)) { const m = nodeMap.get(n.motherId); ls.push({ id: `m${n.id}`, x1: m.x + 65, y1: m.y + 80, x2: n.x + 65, y2: n.y }) }
    }); return ls
  }

  function filterPeople(q) {
    setSearch(q)
    const filtered = q ? allPeople.filter(p => p.displayName.toLowerCase().includes(q.toLowerCase())) : allPeople
    const laid = layoutNodes(filtered); setNodes(laid); setLines(buildLines(laid))
  }

  async function selectPerson(node) {
    setSelectedId(node.id)
    const { data } = await api.get(`/people/${node.id}`)
    setSelected(data)
  }

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/people/tree')
      setAllPeople(data)
      const laid = layoutNodes(data); setNodes(laid); setLines(buildLines(laid))
      const personParam = searchParams.get('person')
      if (personParam) { const node = laid.find(n => n.id === Number(personParam)); if (node) selectPerson(node) }
    })()
  }, [])

  return (
    <div className="tree-page">
      <div className="page-header"><h1 className="display-font page-title">Family Tree</h1><p className="text-muted page-sub">The Wyatt family lineage from Kent, England to America</p><hr className="gold-rule" /></div>
      <div className="tree-toolbar">
        <input value={search} onChange={e => filterPeople(e.target.value)} placeholder="Search family members..." className="search-input" />
        <div className="tree-controls">
          <button className="btn btn-ghost btn-sm" onClick={() => zoom(0.1)}>＋ Zoom</button>
          <button className="btn btn-ghost btn-sm" onClick={() => zoom(-0.1)}>－ Zoom</button>
          <button className="btn btn-ghost btn-sm" onClick={resetView}>Reset</button>
        </div>
      </div>
      <div className="tree-layout">
        <div className="tree-canvas-wrap">
          <div className="tree-canvas" style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <svg width={svgWidth} height={svgHeight} className="tree-svg">
              {lines.map(line => <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#7A6020" strokeWidth="1" />)}
            </svg>
            {nodes.map(node => (
              <div key={node.id} className={`person-node${selectedId === node.id ? ' selected' : ''}${node.isPrivate ? ' private' : ''}`} style={{ left: node.x + 'px', top: node.y + 'px' }} onClick={() => selectPerson(node)}>
                <div className="node-avatar">
                  {node.thumbnailUrl ? <img src={node.thumbnailUrl} alt={node.displayName} /> : <span className="avatar-initials">{initials(node.displayName)}</span>}
                </div>
                <div className="node-name">{node.displayName}</div>
                {(!node.isPrivate || auth.token) && <div className="node-dates text-muted">{node.birthDate ? node.birthDate.substring(0, 4) : '?'} {node.deathDate ? '– ' + node.deathDate.substring(0, 4) : ''}</div>}
              </div>
            ))}
          </div>
        </div>
        {selected && (
          <div className="person-panel card">
            <button className="panel-close" onClick={() => { setSelected(null); setSelectedId(null) }}>✕</button>
            <div className="panel-avatar">
              {selected.thumbnailUrl ? <img src={selected.thumbnailUrl} /> : <div className="avatar-large">{initials(selected.firstName + ' ' + selected.lastName)}</div>}
            </div>
            <h2 className="panel-name display-font">{selected.firstName} {selected.lastName}</h2>
            {(selected.birthDate || selected.deathDate) && <div className="panel-dates text-muted">{selected.birthDate || '?'} {selected.deathDate ? '– ' + selected.deathDate : ''}</div>}
            {selected.birthPlace && <div className="panel-place text-muted">{selected.birthPlace}</div>}
            <hr className="gold-rule" />
            {selected.bio && <p className="panel-bio text-muted">{selected.bio}</p>}
            {(selected.fatherName || selected.motherName) && (
              <div className="panel-parents">
                {selected.fatherName && <div className="text-muted">Father: <span className="text-gold">{selected.fatherName}</span></div>}
                {selected.motherName && <div className="text-muted">Mother: <span className="text-gold">{selected.motherName}</span></div>}
              </div>
            )}
            {(selected.mediaCount || selected.docCount || selected.storyCount) ? (
              <div className="panel-counts">
                {selected.mediaCount > 0 && <Link to={`/photos?person=${selected.id}`} className="count-chip">📷 {selected.mediaCount} photos</Link>}
                {selected.docCount > 0 && <Link to={`/documents?person=${selected.id}`} className="count-chip">📄 {selected.docCount} documents</Link>}
                {selected.storyCount > 0 && <Link to={`/stories?person=${selected.id}`} className="count-chip">📖 {selected.storyCount} stories</Link>}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
