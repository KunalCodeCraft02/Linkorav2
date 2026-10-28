import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { getTemplate } from '../../../shared/templates.mjs'
import TemplatePreview from '../components/TemplatePreview'
import {
  RocketIcon,
  CopyIcon,
  TrashIcon,
  LayoutIcon,
  SettingsIcon,
  ExternalIcon,
  PlusIcon,
} from '../components/icons'

/**
 * The dashboard.
 *
 * Every website the signed-in user owns is listed here with the actions that
 * apply to it. A user only ever sees their own websites - the list is
 * filtered by the authenticated owner on the server.
 */

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
]

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function relativeTime(value) {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(value)
}

/* -------------------------------------------------------------------------- */

function WebsiteCard({ website, onEdit, onPreview, onPublish, onUnpublish, onDuplicate, onRename, onDelete }) {
  const template = getTemplate(website.templateId)
    const previewTemplate = useMemo(() => {
    const s = website.site || {}
    const base = template || {}
    return {
      id: website.templateId,
      themeId: s.themeId || website.themeId || base.themeId,
      layout: s.layout || base.layout,
      contentWidth: s.contentWidth || base.contentWidth,
      spacingScale: s.spacingScale || base.spacingScale,
      radius: typeof s.radius === 'number' ? s.radius : base.radius,
      profileLayout: s.profileLayout || base.profileLayout,
      socialIconStyle: s.socialIconStyle || base.socialIconStyle,
      buttonPreset: s.buttonPreset || base.buttonPreset,
      shadow: s.shadow || base.shadow,
      sections: website.sections || base.sections || [],
    }
  }, [website, template])

  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(website.name)

  const isPublished = website.status === 'published'

  const submitRename = async (event) => {
    event.preventDefault()
    const next = nameDraft.trim()
    if (!next || next === website.name) {
      setNameDraft(website.name)
      setRenaming(false)
      return
    }
    await onRename(website.id, next)
    setRenaming(false)
  }

  return (
    <article className="site-card">
      <div
        className="site-card__thumb"
        style={{ position: 'relative', display: 'block', width: '100%', height: 'auto', padding: 0, background: 'none', overflow: 'hidden', borderBottom: 0 }}      >
        <TemplatePreview template={previewTemplate} height={250} />
        <span
          className={`site-card__status ${isPublished ? 'is-published' : 'is-draft'}`}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
        >
          {isPublished ? 'Published' : 'Draft'}
        </span>
      </div>
      <div className="site-card__body">
        {renaming ? (
          <form className="site-card__rename" onSubmit={submitRename}>
            <input
              autoFocus
              aria-label="Website name"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => {
                setNameDraft(website.name)
                setRenaming(false)
              }}
            />
          </form>
        ) : (
          <h3>{website.name}</h3>
        )}

        <p className="site-card__meta">
          {template?.name || 'Custom'} &middot; {website.sectionCount} block
          {website.sectionCount === 1 ? '' : 's'} &middot; edited {relativeTime(website.updatedAt)}
        </p>

        {isPublished && website.publicUrl ? (
          <a className="site-card__url" href={website.publicUrl} target="_blank" rel="noreferrer">
            {website.publicUrl.replace(/^https?:\/\//, '')}
            <ExternalIcon size={13} />
          </a>
        ) : null}

        <div className="site-card__actions">
          <button type="button" className="btn" onClick={() => onEdit(website.id)}>
            Edit
          </button>
          <button type="button" className="btn ghost" onClick={() => onPreview(website.id)}>
            Preview
          </button>
          {isPublished ? (
            <button type="button" className="btn ghost" onClick={() => onUnpublish(website.id)}>
              Unpublish
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={() => onPublish(website.id)}>
              <RocketIcon size={15} />
              Publish
            </button>
          )}
          <button
            type="button"
            className="icon-button icon-button--bare"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={`More actions for ${website.name}`}
            aria-expanded={menuOpen}
          >
            <SettingsIcon size={16} />
          </button>
        </div>

        {menuOpen ? (
          <div className="site-card__menu">
            <button type="button" onClick={() => { setRenaming(true); setMenuOpen(false) }}>
              Rename
            </button>
            <button type="button" onClick={() => { onDuplicate(website.id); setMenuOpen(false) }}>
              <CopyIcon size={15} /> Duplicate
            </button>
            <button type="button" className="is-danger" onClick={() => { onDelete(website); setMenuOpen(false) }}>
              <TrashIcon size={15} /> Delete
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState('')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    const result = await apiRequest('/websites')
    setWebsites(result.websites || [])
  }, [])

  useEffect(() => {
    let cancelled = false
    apiRequest('/websites')
      .then((result) => {
        if (!cancelled) setWebsites(result.websites || [])
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(
    () => (filter === 'all' ? websites : websites.filter((website) => website.status === filter)),
    [filter, websites],
  )

  const shown = showAll ? visible : visible.slice(0, 12)

  const run = useCallback(
    async (id, action, successMessage) => {
      setBusy(id)
      setError('')
      setNotice('')
      try {
        await action()
        await load()
        if (successMessage) {
          setNotice(successMessage)
          setTimeout(() => setNotice(''), 4000)
        }
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setBusy('')
      }
    },
    [load],
  )

  const publish = (id) =>
    run(id, () => apiRequest(`/websites/${id}/publish`, { method: 'POST' }), 'Your website is live.')

  const unpublish = (id) =>
    run(id, () => apiRequest(`/websites/${id}/unpublish`, { method: 'POST' }), 'Your website is no longer public.')

  const duplicate = (id) =>
    run(id, () => apiRequest(`/websites/${id}/duplicate`, { method: 'POST' }), 'A copy was added to your websites.')

  const rename = (id, name) =>
    run(id, () => apiRequest(`/websites/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }), 'Renamed.')

  const remove = async (website) => {
    await run(website.id, () => apiRequest(`/websites/${website.id}`, { method: 'DELETE' }), 'Website deleted.')
    setPendingDelete(null)
  }

  const draftCount = websites.filter((website) => website.status === 'draft').length
  const publishedCount = websites.filter((website) => website.status === 'published').length

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-inner">
          <a className="editor-brand" href="/home">
            <i aria-hidden="true" />
            Linkora
          </a>
          <div className="dashboard__header-actions">
            <a className="btn ghost" href="/templates">
              <LayoutIcon size={16} />
              Browse templates
            </a>
            <a className="btn" href="/templates">
              <PlusIcon size={16} />
              New website
            </a>
          </div>
        </div>
      </header>

      <div className="dashboard__wrap">
        <div className="dashboard__intro">
          <div>
            <span className="lx-eyebrow">your corner of the internet</span>
            <h1>Recents</h1>
          </div>
          <div className="dashboard__stats">
            <span>
              <strong>{websites.length}</strong> total
            </span>
            <span>
              <strong>{draftCount}</strong> draft{draftCount === 1 ? '' : 's'}
            </span>
            <span>
              <strong>{publishedCount}</strong> published
            </span>
          </div>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="form-success" role="status">
            {notice}
          </p>
        ) : null}

        {websites.length > 0 ? (
          <div className="chip-row" role="group" aria-label="Filter websites">
            {FILTERS.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={`chip ${filter === entry.id ? 'is-active' : ''}`}
                aria-pressed={filter === entry.id}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
                {entry.id === 'draft' && draftCount ? ` (${draftCount})` : ''}
                {entry.id === 'published' && publishedCount ? ` (${publishedCount})` : ''}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="dashboard__loading">
            <span className="spinner" aria-hidden="true" />
            <p>Loading your websites...</p>
          </div>
        ) : visible.length === 0 ? (
          <section className="dashboard__empty">
            <h2>{websites.length === 0 ? 'Make your first page' : 'Nothing here yet'}</h2>
            <p>
              {websites.length === 0
                ? 'Pick a template, change anything you like, and publish it with one link.'
                : 'No websites match this filter.'}
            </p>
            <a className="btn" href="/templates">
              Browse templates
            </a>
          </section>
        ) : (
          <div className="site-grid">
            {shown.map((website) =>(
              <WebsiteCard
                key={website.id}
                website={website}
                busy={busy === website.id}
                onEdit={(id) => {
                  window.location.href = `/editor/${id}`
                }}
                onPreview={(id) => {
                  window.location.href = `/preview/${id}`
                }}
                onPublish={publish}
                onUnpublish={unpublish}
                onDuplicate={duplicate}
                onRename={rename}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      {visible.length > 12 && !showAll ? (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
             <button type="button" className="btn ghost" onClick={() => setShowAll(true)}>
                Show all {visible.length}
              </button>
            </div>
          ) : null}

      {pendingDelete ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingDelete(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-title">Delete "{pendingDelete.name}"?</h2>
            <p>
              This removes the website and its public address for good. If it is published, the
              public link stops working immediately.
            </p>
            <div className="modal__actions">
              <button type="button" className="btn ghost" onClick={() => setPendingDelete(null)}>
                Keep it
              </button>
              <button type="button" className="btn btn--danger" onClick={() => remove(pendingDelete)}>
                <TrashIcon size={15} />
                Delete website
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
