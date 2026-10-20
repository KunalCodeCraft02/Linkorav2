import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useDocumentHistory, normalizeForSave } from '../editor/useDocumentHistory'
import { useAutosave, stableStringify } from '../editor/useAutosave'
import EditorCanvas from '../editor/EditorCanvas'
import LeftSidebar from '../editor/LeftSidebar'
import InspectorPanel from '../editor/InspectorPanel'
import SettingsPanel from '../editor/SettingsPanel'
import { buildDocumentFromTemplate, getTemplate } from '../../../shared/templates.mjs'
import { getTheme } from '../../../shared/themes.mjs'
import { resolveDocument } from '../../../shared/resolve.mjs'
import { SECTION_DEFS } from '../../../shared/website-schema.mjs'
import {
  UndoIcon,
  RedoIcon,
  MonitorIcon,
  TabletIcon,
  PhoneIcon,
  RocketIcon,
  GlobeIcon,
  WarningIcon,
  CheckIcon,
} from '../components/icons'

/**
 * The visual editor.
 *
 * Layout: a tool sidebar on the left, a live canvas in the middle, and a
 * properties inspector on the right. The canvas is the dominant element -
 * it is the thing being edited, and everything else supports it.
 */

const DEVICES = [
  { id: 'mobile', label: 'Mobile', Icon: PhoneIcon, width: 390 },
  { id: 'tablet', label: 'Tablet', Icon: TabletIcon, width: 620 },
  { id: 'desktop', label: 'Desktop', Icon: MonitorIcon, width: 900 },
]

const ZOOM_LEVELS = [0.5, 0.75, 1]

function isTypingTarget(target) {
  return (
    target &&
    (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
  )
}

export default function BuilderPage({ websiteId }) {
  const [loadError, setLoadError] = useState('')
  const [serverDocument, setServerDocument] = useState(null)
  // The website that has finished loading. The editor renders nothing until
  // this matches the website being asked for.
  const [loadedId, setLoadedId] = useState(null)

  const history = useDocumentHistory({ name: '', slug: '', site: {}, profile: {}, sections: [] })
  const {
    document: doc,
    sections,
    selected,
    selectedId,
    setSelectedId,
    canUndo,
    canRedo,
    undo,
    redo,
    addSection,
    setSectionProp,
    removeSection,
    duplicateSection,
    moveSection,
    reorderSections,
    updateSite,
    setSiteProp,
    setName,
    replaceDocument,
  } = history

  // The payload that is known to be on the server. Until the website has
  // loaded, autosave stays disabled so the empty starting document is
  // never written over the real one.
  const [savedBaseline, setSavedBaseline] = useState(null)

  const autosave = useAutosave({
    websiteId,
    document: doc,
    baseline: savedBaseline,
    enabled: Boolean(savedBaseline),
  })

  const [view, setView] = useState('add')
  const [search, setSearch] = useState('')
  const [device, setDevice] = useState('mobile')
  const [zoom, setZoom] = useState(1)
  const [publishError, setPublishError] = useState('')
  const [publishNotice, setPublishNotice] = useState('')
  const [slugDraft, setSlugDraft] = useState('')
  const [slugStatus, setSlugStatus] = useState('idle')
  const [confirmSwitch, setConfirmSwitch] = useState(null)

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false
    apiRequest(`/websites/${websiteId}`)
      .then((result) => {
        if (cancelled) return
        const website = result.website
        setServerDocument(website)
        setSlugDraft(website.slug || '')
        const loaded = {
          name: website.name,
          slug: website.slug,
          site: website.site || {},
          profile: website.profile || {},
          sections: website.sections || [],
        }
        // Record what is already on the server before the editor starts
        // autosaving, so opening a website is not treated as an edit.
        setSavedBaseline(stableStringify(normalizeForSave(loaded)))
        replaceDocument(loaded)
        setLoadedId(websiteId)
      })
      .catch((requestError) => {
        if (cancelled) return
        setLoadError(requestError.message)
        setLoadedId(websiteId)
      })
    return () => {
      cancelled = true
    }
  }, [websiteId, replaceDocument])

  /* ---------------------------------------------------------------------- */
  /* Saving the slug                                                          */
  /* ---------------------------------------------------------------------- */

  const saveSlug = useCallback(async () => {
    const next = slugDraft.trim().toLowerCase()
    if (!next || next === doc.slug) {
      setSlugDraft(doc.slug)
      setSlugStatus('idle')
      return
    }
    if (!/^[a-z0-9-]{3,80}$/.test(next)) {
      setSlugStatus('error')
      setSlugDraft(doc.slug)
      return
    }
    setSlugStatus('saving')
    try {
      await apiRequest(`/websites/${websiteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ slug: next }),
      })
      setSlugStatus('saved')
      setTimeout(() => setSlugStatus('idle'), 2000)
    } catch {
      setSlugStatus('error')
      setSlugDraft(doc.slug)
    }
  }, [doc.slug, slugDraft, websiteId])

  /* ---------------------------------------------------------------------- */
  /* Uploads                                                                  */
  /* ---------------------------------------------------------------------- */

  const uploadFile = useCallback(
    async (file) => {
      const body = new FormData()
      body.append('asset', file)
      const result = await apiRequest(`/websites/${websiteId}/assets`, { method: 'POST', body })
      return result.url
    },
    [websiteId],
  )

  // `key` is the name of the property being set. It is not always "url" -
  // a profile photo is stored under "image" and a video poster under
  // "poster", so the caller has to say which one it means.
  const uploadToSection = useCallback(
    async (key, file) => {
      const url = await uploadFile(file)
      if (selectedId) setSectionProp(selectedId, key, url)
      return url
    },
    [selectedId, setSectionProp, uploadFile],
  )

  const uploadGalleryItem = useCallback(
    async (index, file) => {
      const url = await uploadFile(file)
      const items = [...(selected?.props?.items || [])]
      if (!items[index]) return
      items[index] = { ...items[index], url }
      setSectionProp(selectedId, 'items', items)
    },
    [selected, selectedId, setSectionProp, uploadFile],
  )

  /* ---------------------------------------------------------------------- */
  /* Template and theme                                                       */
  /* ---------------------------------------------------------------------- */

  const applyTemplate = useCallback(
    (templateId) => {
      const template = getTemplate(templateId)
      if (!template) return
      setConfirmSwitch({ kind: 'template', id: templateId })
    },
    [],
  )

  const confirmTemplateSwitch = useCallback(() => {
    const templateId = confirmSwitch.id
    const template = getTemplate(templateId)
    setConfirmSwitch(null)
    if (!template) return

    // The new template supplies the structure and the theme. The user's own
    // content is carried across wherever the section types still match, so a
    // template switch never silently throws their work away.
    //
    // Each old section is carried across at most once, so a template with
    // two text blocks does not copy the same text into both of them.
    const previous = sections
    const fresh = buildDocumentFromTemplate(template.id)
    const used = new Set()
    const carried = fresh.sections.map((section) => {
      const match = previous.find(
        (candidate, index) => candidate.type === section.type && !used.has(index),
      )
      if (!match) return section
      used.add(previous.indexOf(match))
      return {
        ...section,
        props: { ...section.props, ...match.props },
      }
    })

    replaceDocument({
      name: doc.name,
      slug: doc.slug,
      site: {
        ...fresh.site,
        templateId: template.id,
        themeId: template.themeId,
        layout: template.layout,
        contentWidth: template.contentWidth,
        spacingScale: template.spacingScale,
        radius: template.radius,
        profileLayout: template.profileLayout,
        socialIconStyle: template.socialIconStyle,
        buttonPreset: template.buttonPreset,
        shadow: template.shadow,
      },
      profile: { ...fresh.profile, ...doc.profile },
      sections: carried,
    })
    setSelectedId(null)
  }, [confirmSwitch, doc.name, doc.profile, doc.slug, replaceDocument, sections, setSelectedId])

  const applyTheme = useCallback(
    (themeId) => {
      const theme = getTheme(themeId)
      if (!theme) return
      // Applying a theme resets the colours and typography to that preset,
      // but keeps the layout and the content exactly as they are. The
      // overrides are cleared rather than filled in with the theme's values,
      // so the theme stays the single source of truth for the palette.
      updateSite({
        themeId: theme.id,
        colors: {},
        typography: {},
        background: {},
        radius: theme.radius,
        shadow: theme.shadow,
        buttonPreset: theme.buttonPreset,
        socialIconStyle: theme.socialIconStyle,
      })
    },
    [updateSite],
  )

  /* ---------------------------------------------------------------------- */
  /* Publishing                                                               */
  /* ---------------------------------------------------------------------- */

  const status = serverDocument?.status || 'draft'

  const togglePublish = useCallback(async () => {
    setPublishError('')
    setPublishNotice('')
    try {
      // Make sure the latest edits are on the server before publishing a
      // snapshot of them.
      await autosave.saveNow()
      const action = status === 'published' ? 'unpublish' : 'publish'
      const result = await apiRequest(`/websites/${websiteId}/${action}`, { method: 'POST' })
      setServerDocument((current) => ({
        ...current,
        status: result.website.status,
        publishedAt: result.website.publishedAt,
        publicUrl: result.publicUrl || result.website.publicUrl,
      }))
      setPublishNotice(
        result.website.status === 'published'
          ? `Published at ${result.publicUrl || result.website.publicUrl}`
          : 'This website is no longer public.',
      )
      setTimeout(() => setPublishNotice(''), 5000)
    } catch (requestError) {
      setPublishError(requestError.message)
    }
  }, [autosave, status, websiteId])

  /* ---------------------------------------------------------------------- */
  /* Keyboard shortcuts                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) return
      const modifier = event.ctrlKey || event.metaKey

      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault()
        autosave.saveNow()
        return
      }
      if (modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (selectedId) duplicateSection(selectedId)
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!selectedId) return
        event.preventDefault()
        removeSection(selectedId)
        return
      }
      if (event.key === 'Escape') {
        setSelectedId(null)
        return
      }
      if (selectedId && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault()
        moveSection(selectedId, event.key === 'ArrowUp' ? -1 : 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [autosave, duplicateSection, moveSection, redo, removeSection, selectedId, setSelectedId, undo])

  // Warn before leaving with unsaved work.
  const hasUnsavedChanges = autosave.state === 'saving' || autosave.state === 'error' || autosave.state === 'pending'
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  /* ---------------------------------------------------------------------- */
  /* Derived                                                                  */
  /* ---------------------------------------------------------------------- */

  const selectedTitle = useMemo(
    () => SECTION_DEFS[selected?.type]?.label || 'Block',
    [selected],
  )

  const websiteForCanvas = useMemo(
    () => ({ ...doc, name: doc.name }),
    [doc],
  )

  // The resolved tokens are what the page actually looks like right now.
  // The settings panel shows them, so a colour picker never displays a value
  // that is different from the colour on screen.
  const resolvedTokens = useMemo(
    () => resolveDocument({ site: doc.site, profile: doc.profile, sections: doc.sections }).tokens,
    [doc],
  )

  if (loadedId !== websiteId) {
    return (
      <main className="editor-loading">
        <span className="spinner" aria-hidden="true" />
        <p>Opening your editor...</p>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="editor-loading">
        <WarningIcon size={28} />
        <p>{loadError}</p>
        <a className="btn" href="/home">
          Back to your websites
        </a>
      </main>
    )
  }

  return (
    <main className="editor">
      <header className="editor-toolbar">
        <div className="editor-toolbar__left">
          <a className="editor-brand" href="/home" aria-label="Back to your websites">
            <i aria-hidden="true" />
            Linkora
          </a>
          <input
            className="editor-name"
            aria-label="Website name"
            value={doc.name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="editor-toolbar__center">
          <div className="tool-group" role="group" aria-label="Undo and redo">
            <button type="button" className="icon-button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
              <UndoIcon size={17} />
            </button>
            <button type="button" className="icon-button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
              <RedoIcon size={17} />
            </button>
          </div>

          <div className="tool-group" role="group" aria-label="Preview size">
            {DEVICES.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                className={`icon-button ${device === id ? 'is-active' : ''}`}
                onClick={() => setDevice(id)}
                title={`${label} preview`}
                aria-label={`${label} preview`}
                aria-pressed={device === id}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>

          <div className="tool-group" role="group" aria-label="Zoom">
            {ZOOM_LEVELS.map((level) => (
              <button
                type="button"
                key={level}
                className={`icon-button zoom-button ${zoom === level ? 'is-active' : ''}`}
                onClick={() => setZoom(level)}
                aria-label={`Zoom ${Math.round(level * 100)}%`}
                aria-pressed={zoom === level}
              >
                {Math.round(level * 100)}%
              </button>
            ))}
          </div>
        </div>

        <div className="editor-toolbar__right">
          <SaveIndicator state={autosave.state} error={autosave.error} onRetry={autosave.retry} />

          {status === 'published' && serverDocument?.publicUrl ? (
            <a className="btn ghost" href={serverDocument.publicUrl} target="_blank" rel="noreferrer">
              <GlobeIcon size={16} /> View live
            </a>
          ) : null}

          <a className="btn ghost" href={`/preview/${websiteId}`}>
            Preview
          </a>

          <button type="button" className="btn" onClick={togglePublish}>
            <RocketIcon size={16} />
            {status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="editor-body">
        <LeftSidebar
          view={view}
          setView={setView}
          search={search}
          setSearch={setSearch}
          sections={sections}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={(type) => addSection(type)}
          onToggleHidden={(id) => {
            const section = sections.find((entry) => entry.id === id)
            if (section) setSectionProp(id, 'hidden', !section.props?.hidden)
          }}
          onMove={moveSection}
          onRemove={removeSection}
          onDuplicate={duplicateSection}
          currentTemplateId={doc.site?.templateId}
          onApplyTemplate={applyTemplate}
          currentThemeId={doc.site?.themeId}
          onApplyTheme={applyTheme}
        >
          <SettingsPanel
            site={doc.site || {}}
            tokens={resolvedTokens}
            onSiteChange={(key, value) => {
              if (key === 'colors' || key === 'typography' || key === 'background') {
                updateSite({ [key]: value })
              } else {
                setSiteProp(key, value)
              }
            }}
            slug={doc.slug}
            slugDraft={slugDraft}
            onSlugDraftChange={setSlugDraft}
            onSlugSave={saveSlug}
            slugStatus={slugStatus}
          />
        </LeftSidebar>

        <EditorCanvas
          website={websiteForCanvas}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={reorderSections}
          onDuplicate={duplicateSection}
          onRemove={removeSection}
          onMove={moveSection}
          device={device}
          zoom={zoom}
        />

        <InspectorPanel
          selected={selected}
          title={selectedTitle}
          onChangeProp={(key, value) => setSectionProp(selectedId, key, value)}
          onChangeItems={(items) => setSectionProp(selectedId, 'items', items)}
          onUpload={uploadToSection}
          onUploadGalleryItem={uploadGalleryItem}
        />
      </div>

      {publishError ? (
        <button type="button" className="editor-toast editor-toast--error" onClick={() => setPublishError('')}>
          <WarningIcon size={16} /> {publishError}
        </button>
      ) : null}
      {publishNotice ? (
        <button type="button" className="editor-toast" onClick={() => setPublishNotice('')}>
          <CheckIcon size={16} /> {publishNotice}
        </button>
      ) : null}
      {autosave.error && autosave.state !== 'error' ? (
        <button type="button" className="editor-toast editor-toast--error" onClick={() => setPublishError('')}>
          <WarningIcon size={16} /> {autosave.error}
        </button>
      ) : null}

      {confirmSwitch ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmSwitch(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="confirm-title">Switch to a new template?</h2>
            <p>
              Your text, images and links will be carried across to the new layout where they
              still fit. Blocks that do not exist in the new template will be removed.
            </p>
            <div className="modal__actions">
              <button type="button" className="btn ghost" onClick={() => setConfirmSwitch(null)}>
                Keep editing
              </button>
              <button type="button" className="btn" onClick={confirmTemplateSwitch}>
                Switch template
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

/* -------------------------------------------------------------------------- */

function SaveIndicator({ state, error, onRetry }) {
  if (state === 'saving') {
    return (
      <span className="save-indicator save-indicator--saving">
        <span className="spinner spinner--small" aria-hidden="true" />
        Saving
      </span>
    )
  }
  if (state === 'error') {
    return (
      <button type="button" className="save-indicator save-indicator--error" onClick={onRetry} title={error}>
        <WarningIcon size={15} />
        Save failed - retry
      </button>
    )
  }
  if (state === 'pending') {
    return (
      <span className="save-indicator save-indicator--pending">
        <span className="spinner spinner--small" aria-hidden="true" />
        Unsaved changes
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="save-indicator save-indicator--saved">
        <CheckIcon size={15} />
        Saved
      </span>
    )
  }
  return <span className="save-indicator">All changes saved</span>
}
