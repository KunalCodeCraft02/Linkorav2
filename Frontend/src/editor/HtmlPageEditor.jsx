import { useMemo, useState } from 'react'
import { DESIGNS } from '../components/sections'
import { extractFields } from '../lib/htmlFields'

const clean = (value) => value.replace(/\s+/g, ' ').trim()

/**
 * Lists every text and link found in the selected design, so each template
 * shows exactly the fields it actually has.
 */
export default function HtmlPageEditor({ props, onChangeProp }) {
  const design = DESIGNS[props.style] || DESIGNS.pink
  const [query, setQuery] = useState('')

  const fields = useMemo(() => {
    const doc = new DOMParser().parseFromString(design.html, 'text/html')
    const { texts, links } = extractFields(doc.body)
    return {
      texts: texts.map((node, i) => ({ id: `t${i}`, original: clean(node.nodeValue) })),
      links: links.map((el, i) => {
        const href = el.getAttribute('href') || ''
        return { id: `l${i}`, original: href === '#' ? '' : href, label: clean(el.textContent).slice(0, 40) || 'Link' }
      }),
    }
  }, [design])

  const edits = props.edits || []
  const byId = new Map(edits.map((entry) => [entry.id, entry]))

  const update = (id, key, value, original) => {
    const rest = edits.filter((entry) => entry.id !== id)
    onChangeProp('edits', value === original ? rest : [...rest, { id, [key]: value }])
  }

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
          const value = byId.get(field.id)?.text ?? field.original
          const id = `edit-${field.id}`
          return (
            <div className="insp-field" key={field.id}>
              <label className="insp-label" htmlFor={id}>{field.original.slice(0, 32)}</label>
              {field.original.length > 60 ? (
                <textarea id={id} rows={3} value={value} onChange={(e) => update(field.id, 'text', e.target.value, field.original)} />
              ) : (
                <input id={id} type="text" value={value} onChange={(e) => update(field.id, 'text', e.target.value, field.original)} />
              )}
            </div>
          )
        })}
      </section>

      <section className="insp-group">
        <h4 className="insp-group__title">Links ({linkFields.length})</h4>
        {linkFields.map((field) => {
          const value = byId.get(field.id)?.href ?? field.original
          const id = `edit-${field.id}`
          return (
            <div className="insp-field" key={field.id}>
              <label className="insp-label" htmlFor={id}>{field.label}</label>
              <input
                id={id}
                type="text"
                placeholder="https://, email or phone"
                value={value}
                onChange={(e) => update(field.id, 'href', e.target.value, field.original)}
              />
            </div>
          )
        })}
      </section>
    </>
  )
}