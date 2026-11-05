import { useEffect, useState } from 'react'
import WebsiteRenderer from '../components/WebsiteRenderer'
import { apiRequest } from '../lib/api'
import { MonitorIcon, TabletIcon, PhoneIcon, ArrowLeftIcon } from '../components/icons'

/**
 * A full-page preview of a website.
 *
 * It renders the same document through the same renderer the published page
 * uses, so what the owner sees here is exactly what a visitor will get.
 *
 * The preview opens in the mobile frame. A link-in-bio page is read on a
 * phone far more often than on a desktop, so the phone is the size that
 * actually matters.
 *
 * The desktop frame is sized to the document's own content width rather than
 * to some fixed page width. A page whose content is 540px wide used to be
 * shown inside a 940px frame, which left a wide band of empty space beside
 * the content and made the page look broken.
 */
const DEVICES = [
  { id: 'mobile', label: 'Mobile', Icon: PhoneIcon },
  { id: 'tablet', label: 'Tablet', Icon: TabletIcon },
  { id: 'desktop', label: 'Desktop', Icon: MonitorIcon },
]

export default function PreviewPage({ websiteId }) {
  const [website, setWebsite] = useState(null)
  const [device, setDevice] = useState('mobile')

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

  // The width the document's content is actually drawn at. The desktop frame
  // is sized to it so the preview never shows more page than there is
  // content.
  const contentWidth = website.tokens?.contentWidth || 540

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
            {DEVICES.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                className={`icon-button ${device === id ? 'is-active' : ''}`}
                onClick={() => setDevice(id)}
                aria-label={`${label} preview`}
                aria-pressed={device === id}
                title={`${label} preview`}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
          <a className="btn ghost" href={`/editor/${website.id}`}>
            <ArrowLeftIcon size={16} />
            Back to editor
          </a>
        </div>
      </header>

      <div className="preview-stage">
        <div
          className={`preview-frame preview-frame--${device}`}
          style={{ '--preview-content-width': `${contentWidth}px` }}
        >
          <WebsiteRenderer website={website} />
        </div>
      </div>
    </main>
  )
}
