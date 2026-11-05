import { useMemo, useState } from 'react'
import { DESIGNS } from '../components/sections'
import { extractFields } from '../lib/htmlFields'
import { FONT_LIST } from '../../../shared/website-schema.mjs'

const clean = (value) => value.replace(/\s+/g, ' ').trim()
const STYLE_KEYS = ['font', 'size', 'weight', 'lh', 'ls', 'color', 'align']

export default function HtmlPageEditor({ props, onChangeProp }) {
  const design = DESIGNS[props.style] || DESIGNS.pink
  const [query, setQuery] = useState('')

  const fields = useMemo(() => {
    const doc = new DOMParser().parseFromString(design.html, 'text/html')
    // Name, brand and bio already have their own fields at the top of the
    // panel, so they are left out of the Texts list.
    const own = [design.name, design.brand, design.bio]
      .filter(Boolean)
      .map((selector) => doc.querySelector(selector))
      .filter(Boolean)
    const { texts, links } = extractFields(doc.body)
    return {
      texts: texts
        .map((node, i) => ({ id: `t${i}`, original: clean(node.nodeValue), dup: own.some((el) => el.contains(node)) }))
        .filter((field) => !field.dup),
      links: links.map((el, i) => {
        const href = el.getAttribute('href') || ''
        return { id: `l${i}`, original: href === '#' ? '' : href, label: clean(el.textContent).slice(0, 40) || 'Link' }
      }),
    }
  }, [design])

  const edits = props.edits || []
  const extra = props.extra || []
  const byId = new Map(edits.map((entry) => [entry.id, entry]))

  // Merge a change into one field's edit record; an empty record is dropped.
  const patch = (id, changes) => {
    const next = { ...(byId.get(id) || {}), ...changes, id }
    const kept = { id }
    for (const key of Object.keys(next)) if (key !== 'id' && next[key]) kept[key] = next[key]
    const rest = edits.filter((entry) => entry.id !== id)
    onChangeProp('edits', Object.keys(kept).length > 1 ? [...rest, kept] : rest)
  }

  const resetStyle = (id) => patch(id, Object.fromEntries(STYLE_KEYS.map((key) => [key, ''])))

  const setExtra = (next) => onChangeProp('extra', next)
  const updateExtra = (id, changes) => setExtra(extra.map((link) => (link.id === id ? { ...link, ...changes } : link)))
  const addExtra = () => setExtra([...extra, { id: `x${Date.now().toString(36)}`, text: 'New link', href: '' }])

  const q = query.trim().toLowerCase()
  const matches = (...parts) => !q || parts.some((part) => String(part).toLowerCase().includes(q))
  const textFields = fields.texts.filter((f) => matches(f.original, byId.get(f.id)?.text ?? ''))
  const linkFields = fields.links.filter((f) => matches(f.label, f.original, byId.get(f.id)?.href ?? ''))

  return (
    <>
      <section className="insp-group">
        <h4 className="insp-group__title">Everything on this page</h4>
        <div className="insp-field">
          <input
            type="search"
            placeholder="Search text or links..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search fields"
          />
          {edits.length ? (
            <button type="button" className="insp-link-button" onClick={() => onChangeProp('edits', [])}>
              Reset all edits ({edits.length})
            </button>
          ) : null}
        </div>
      </section>

      <section className="insp-group">
        <h4 className="insp-group__title">Texts ({textFields.length})</h4>
        {textFields.map((field) => {
          const entry = byId.get(field.id) || {}
          const value = entry.text ?? field.original
          const id = `edit-${field.id}`
          const styled = STYLE_KEYS.some((key) => entry[key])
          return (
            <div className="insp-field" key={field.id}>
              <label className="insp-label" htmlFor={id}>{field.original.slice(0, 32)}</label>
              {field.original.length > 60 ? (
                <textarea id={id} rows={3} value={value} onChange={(e) => patch(field.id, { text: e.target.value })} />
              ) : (
                <input id={id} type="text" value={value} onChange={(e) => patch(field.id, { text: e.target.value })} />
              )}

              <details className="insp-details">
                <summary>Style{styled ? ' •' : ''}</summary>
                <label className="insp-sub">Font
                  <select value={entry.font || ''} onChange={(e) => patch(field.id, { font: e.target.value })}>
                    <option value="">Default</option>
                    {FONT_LIST.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                </label>
                <label className="insp-sub">Size ({entry.size || 100}%)
                  <input type="range" min="50" max="250" step="5" value={entry.size || 100}
                    onChange={(e) => patch(field.id, { size: e.target.value === '100' ? '' : e.target.value })} />
                </label>
                <label className="insp-sub">Weight
                  <select value={entry.weight || ''} onChange={(e) => patch(field.id, { weight: e.target.value })}>
                    <option value="">Default</option>
                    {[300, 400, 500, 600, 700, 800].map((w) => <option key={w} value={String(w)}>{w}</option>)}
                  </select>
                </label>
                <label className="insp-sub">Line spacing ({entry.lh || 'default'})
                  <input type="range" min="0.8" max="3" step="0.1" value={entry.lh || 1.4}
                    onChange={(e) => patch(field.id, { lh: e.target.value })} />
                </label>
                <label className="insp-sub">Letter spacing ({entry.ls || 0})
                  <input type="range" min="-5" max="30" step="1" value={entry.ls || 0}
                    onChange={(e) => patch(field.id, { ls: e.target.value === '0' ? '' : e.target.value })} />
                </label>
                <label className="insp-sub">Colour
                  <input type="color" value={entry.color || '#000000'} onChange={(e) => patch(field.id, { color: e.target.value })} />
                </label>
                <label className="insp-sub">Alignment
                  <select value={entry.align || ''} onChange={(e) => patch(field.id, { align: e.target.value })}>
                    <option value="">Default</option>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                {styled ? (
                  <button type="button" className="insp-link-button" onClick={() => resetStyle(field.id)}>Reset style</button>
                ) : null}
              </details>
            </div>
          )
        })}
      </section>

      <section className="insp-group">
        <h4 className="insp-group__title">Links ({linkFields.length})</h4>
        {linkFields.map((field) => {
          const entry = byId.get(field.id) || {}
          const removed = Boolean(entry.del)
          const id = `edit-${field.id}`
          return (
            <div className="insp-field" key={field.id} style={removed ? { opacity: 0.5 } : undefined}>
              <label className="insp-label" htmlFor={id}>{field.label}</label>
              <input
                id={id}
                type="text"
                placeholder="https://, email or phone"
                disabled={removed}
                value={entry.href ?? field.original}
                onChange={(e) => patch(field.id, { href: e.target.value })}
              />
              <button type="button" className="insp-link-button" onClick={() => patch(field.id, { del: removed ? '' : '1' })}>
                {removed ? 'Restore link' : 'Remove from page'}
              </button>
            </div>
          )
        })}
      </section>

      <section className="insp-group">
        <div className="insp-group__head">
          <h4 className="insp-group__title">Extra links ({extra.length})</h4>
          <button type="button" className="insp-add-button" onClick={addExtra}>+ Add link</button>
        </div>
        {extra.length === 0 ? <p className="insp-empty">Add buttons that show below the page.</p> : null}
        {extra.map((link) => (
          <div className="insp-field" key={link.id}>
            <input type="text" placeholder="Button text" value={link.text} onChange={(e) => updateExtra(link.id, { text: e.target.value })} />
            <input type="text" placeholder="https://, email or phone" value={link.href} onChange={(e) => updateExtra(link.id, { href: e.target.value })} />
            <button type="button" className="insp-link-button" onClick={() => setExtra(extra.filter((item) => item.id !== link.id))}>
              Delete link
            </button>
          </div>
        ))}
      </section>
    </>
  )
}