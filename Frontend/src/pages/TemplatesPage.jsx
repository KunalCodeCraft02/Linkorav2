import { useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import TemplatePreview from '../components/TemplatePreview'
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../../../shared/templates.mjs'
import { CheckIcon } from '../components/icons'

/**
 * The template browser.
 *
 * Choosing a template creates a website from it and opens the editor, so
 * the flow is: browse, preview, choose, edit.
 */
export default function TemplatesPage() {
  const [creating, setCreating] = useState('')
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')
  const [detail, setDetail] = useState(null)

  const visible = useMemo(
    () => (category === 'All' ? TEMPLATES : TEMPLATES.filter((template) => template.category === category)),
    [category],
  )

  const choose = async (templateId) => {
    setCreating(templateId)
    setError('')
    try {
      const result = await apiRequest('/websites', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Untitled website',
          templateId,
        }),
      })
      window.location.href = `/editor/${result.website.id}`
    } catch (requestError) {
      setError(requestError.message)
      setCreating('')
    }
  }

  return (
    <main className="templates-page">
      <header className="templates-header">
        <div className="templates-header-inner">
          <a className="editor-brand" href="/home">
            <i aria-hidden="true" />
            Linkora
          </a>
          <a className="btn ghost" href="/home">
            Back to my websites
          </a>
        </div>
      </header>

      <div className="templates-wrap">
        <div className="templates-intro">
          <span className="lx-eyebrow">choose a starting point</span>
          <h1>Templates</h1>
          <p>
            Every template is a complete, editable page. Pick one and you can change every word,
            image, colour and button - the template is only where the page begins.
          </p>
        </div>

        <div className="chip-row chip-row--wide" role="group" aria-label="Filter templates by category">
          {['All', ...TEMPLATE_CATEGORIES].map((entry) => (
            <button
              type="button"
              key={entry}
              className={`chip ${category === entry ? 'is-active' : ''}`}
              aria-pressed={category === entry}
              onClick={() => setCategory(entry)}
            >
              {entry}
            </button>
          ))}
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="templates-grid">
          {visible.map((template) => (
            <article className="template-tile" key={template.id}>
              <button
                type="button"
                className="template-tile__preview"
                onClick={() => setDetail(template)}
                aria-label={`Preview ${template.name}`}
              >
                <TemplatePreview template={template} height={250} />
              </button>
              <div className="template-tile__body">
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => choose(template.id)}
                  disabled={creating === template.id}
                >
                  {creating === template.id ? 'Creating...' : 'Use this template'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {detail ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setDetail(null)}>
          <div
            className="modal modal--large"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__preview">
              <TemplatePreview template={detail} height={460} maxScale={0.72} />
            </div>
            <div className="modal__body">
              <h2 id="template-detail-title">{detail.name}</h2>
              <p>{detail.description}</p>
              <dl className="template-facts">
                <div>
                  <dt>Category</dt>
                  <dd>{detail.category}</dd>
                </div>
                <div>
                  <dt>Blocks</dt>
                  <dd>{detail.sections.length}</dd>
                </div>
                <div>
                  <dt>Theme</dt>
                  <dd>{detail.themeId.replace(/-/g, ' ')}</dd>
                </div>
              </dl>
              <div className="modal__actions">
                <button type="button" className="btn ghost" onClick={() => setDetail(null)}>
                  Close
                </button>
                <button type="button" className="btn" onClick={() => choose(detail.id)} disabled={creating === detail.id}>
                  <CheckIcon size={16} />
                  {creating === detail.id ? 'Creating...' : 'Use this template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
