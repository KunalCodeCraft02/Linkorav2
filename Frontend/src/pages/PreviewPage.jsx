import { useEffect, useState } from 'react'
import WebsiteRenderer from '../components/WebsiteRenderer'
import { apiRequest } from '../lib/api'
import { MonitorIcon, PhoneIcon, ArrowLeftIcon } from '../components/icons'

/**
 * A full-page preview of a website.
 *
 * It renders the same document through the same renderer the published page
 * uses, so what the owner sees here is exactly what a visitor will get.
 */
export default function PreviewPage({ websiteId }) {
  const [website, setWebsite] = useState(null)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    apiRequest(`/websites/${websiteId}`)
      .then((result) => setWebsite(result.website))
      .catch(() => setWebsite(false))
  }, [websiteId])

  if (!website) {
    return (
      <main className="editor-loading">
        {website === false ? 'Website not found.' : 'Loading preview...'}
      </main>
    )
  }

  return (
    <main className="preview-page">
      <header className="preview-toolbar">
        <a className="editor-brand" href="/home">
          <i aria-hidden="true" />
          Linkora
        </a>
        <span className="preview-toolbar__title">
          {website.name} &middot; <em>{website.status}</em>
        </span>
        <div className="preview-toolbar__actions">
          <div className="tool-group" role="group" aria-label="Preview size">
            <button
              type="button"
              className={`icon-button ${!mobile ? 'is-active' : ''}`}
              onClick={() => setMobile(false)}
              aria-label="Desktop preview"
              aria-pressed={!mobile}
              title="Desktop preview"
            >
              <MonitorIcon size={17} />
            </button>
            <button
              type="button"
              className={`icon-button ${mobile ? 'is-active' : ''}`}
              onClick={() => setMobile(true)}
              aria-label="Mobile preview"
              aria-pressed={mobile}
              title="Mobile preview"
            >
              <PhoneIcon size={17} />
            </button>
          </div>
          <a className="btn ghost" href={`/editor/${website.id}`}>
            <ArrowLeftIcon size={16} />
            Back to editor
          </a>
        </div>
      </header>

      <div className={`preview-frame ${mobile ? 'is-mobile' : ''}`}>
        <WebsiteRenderer website={website} />
      </div>
    </main>
  )
}
