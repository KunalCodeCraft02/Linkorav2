import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSection, newId, validateDocument } from '../../../shared/website-schema.mjs'

/**
 * The document the editor works on: its history, its selection, and the
 * operations that change it.
 *
 * Three rules shape this hook:
 *
 *  1. Every change goes through `commit`, which pushes the previous state
 *     onto the undo stack. Nothing mutates the document behind its back, so
 *     undo can always restore a real previous state.
 *
 *  2. Consecutive edits to the *same* property are coalesced into one undo
 *     step. Typing a word should be one undo, not one undo per keystroke,
 *     but undoing a different property should always be a separate step.
 *
 *  3. History is bounded. An editor that holds a hundred full documents in
 *     memory is an editor that will eventually fall over on a large site.
 */

const HISTORY_LIMIT = 60

/** A key that identifies "the same edit" for coalescing purposes. */
function editKey(path) {
  return path.join('.')
}

/**
 * Move an item within an array, returning a new array.
 */
function moveItem(list, from, to) {
  if (from === to || from < 0 || from >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Replace a section by id, returning a new array.
 */
function mapSection(sections, id, updater) {
  return sections.map((section) => (section.id === id ? updater(section) : section))
}

export function useDocumentHistory(initialDocument) {
  const [document_, setDocument] = useState(() => initialDocument)
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // The key of the edit currently being coalesced, and a timer that closes
  // the coalescing window.
  const lastEditKey = useRef(null)
  const coalesceTimer = useRef(null)

  /**
   * The undo and redo stacks are kept in refs rather than only in state,
   * because they have to change *together* with the document. With state,
   * the updates are batched but React may still apply them in separate
   * renders, and a redo performed immediately after an undo could read a
   * stale stack. Refs make each operation atomic.
   */
  const pastRef = useRef([])
  const futureRef = useRef([])
  const documentRef = useRef(document_)

  useEffect(() => {
    documentRef.current = document_
  }, [document_])

  const clearCoalescing = useCallback(() => {
    lastEditKey.current = null
    if (coalesceTimer.current) {
      clearTimeout(coalesceTimer.current)
      coalesceTimer.current = null
    }
  }, [])

  useEffect(() => clearCoalescing, [clearCoalescing])

  /**
   * Apply a change to the document.
   *
   * `path` identifies what is changing (for example `['section', id,
   * 'props', 'label']`). Two changes with the same path in quick succession
   * replace one another in the undo history instead of stacking.
   */
  const commit = useCallback(
    (updater, path = null) => {
      const key = path ? editKey(path) : null
      const current = documentRef.current
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next === current) return

      // Decide whether this change extends the previous undo step.
      const shouldCoalesce = key !== null && key === lastEditKey.current

      if (!shouldCoalesce) {
        const history = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), current]
        pastRef.current = history
        futureRef.current = []
        setPast(history)
        setFuture([])
      }

      if (key !== null) {
        lastEditKey.current = key
        if (coalesceTimer.current) clearTimeout(coalesceTimer.current)
        coalesceTimer.current = setTimeout(clearCoalescing, 700)
      } else {
        clearCoalescing()
      }

      documentRef.current = next
      setDocument(next)
    },
    [clearCoalescing],
  )

  const undo = useCallback(() => {
    clearCoalescing()
    const history = pastRef.current
    if (!history.length) return

    const previous = history[history.length - 1]
    pastRef.current = history.slice(0, -1)
    futureRef.current = [documentRef.current, ...futureRef.current].slice(0, HISTORY_LIMIT)

    documentRef.current = previous
    setDocument(previous)
    setPast(pastRef.current)
    setFuture(futureRef.current)
  }, [clearCoalescing])

  const redo = useCallback(() => {
    clearCoalescing()
    const history = futureRef.current
    if (!history.length) return

    const next = history[0]
    futureRef.current = history.slice(1)
    pastRef.current = [...pastRef.current, documentRef.current].slice(-HISTORY_LIMIT)

    documentRef.current = next
    setDocument(next)
    setPast(pastRef.current)
    setFuture(futureRef.current)
  }, [clearCoalescing])

  /* ---------------------------------------------------------------------- */
  /* Section operations                                                      */
  /* ---------------------------------------------------------------------- */

  const addSection = useCallback(
    (type, atIndex = null) => {
      const section = createSection(type)
      setSelectedId(section.id)
      commit((current) => {
        const sections = [...current.sections]
        const index = atIndex === null ? sections.length : Math.max(0, Math.min(atIndex, sections.length))
        sections.splice(index, 0, section)
        return { ...current, sections }
      })
      return section.id
    },
    [commit],
  )

  const updateSection = useCallback(
    (id, updater, path = null) => {
      commit((current) => ({ ...current, sections: mapSection(current.sections, id, updater) }), path)
    },
    [commit],
  )

  /** Change one property of a section, with undo coalescing on that property. */
  const setSectionProp = useCallback(
    (id, key, value) => {
      updateSection(
        id,
        (section) => ({ ...section, props: { ...section.props, [key]: value } }),
        ['section', id, 'props', key],
      )
    },
    [updateSection],
  )

  const removeSection = useCallback(
    (id) => {
      commit((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }))
      setSelectedId((current) => (current === id ? null : current))
    },
    [commit],
  )

  const duplicateSection = useCallback(
    (id) => {
      let newIdValue = null
      commit((current) => {
        const index = current.sections.findIndex((section) => section.id === id)
        if (index < 0) return current
        const source = current.sections[index]
        const copy = {
          ...source,
          id: newId(source.type),
          props: JSON.parse(JSON.stringify(source.props)),
        }
        newIdValue = copy.id
        const sections = [...current.sections]
        sections.splice(index + 1, 0, copy)
        return { ...current, sections }
      })
      if (newIdValue) setSelectedId(newIdValue)
    },
    [commit],
  )

  const moveSection = useCallback(
    (id, delta) => {
      commit((current) => {
        const from = current.sections.findIndex((section) => section.id === id)
        if (from < 0) return current
        return { ...current, sections: moveItem(current.sections, from, from + delta) }
      })
    },
    [commit],
  )

  /**
   * Move a section to another section's position - used by drag and drop.
   *
   * The two sections are identified by their stable ids rather than by their
   * index, so a drag works even when the array contains hidden sections
   * that are not on the canvas.
   */
  const reorderSections = useCallback(
    (activeId, overId) => {
      commit((current) => {
        const from = current.sections.findIndex((section) => section.id === activeId)
        const to = current.sections.findIndex((section) => section.id === overId)
        if (from < 0 || to < 0 || from === to) return current
        return { ...current, sections: moveItem(current.sections, from, to) }
      })
    },
    [commit],
  )

  /* ---------------------------------------------------------------------- */
  /* Document operations                                                      */
  /* ---------------------------------------------------------------------- */

  const updateSite = useCallback(
    (updater, path = null) => {
      commit((current) => ({ ...current, site: { ...current.site, ...updater } }), path)
    },
    [commit],
  )

  const setSiteProp = useCallback(
    (key, value) => {
      updateSite({ [key]: value }, ['site', key])
    },
    [updateSite],
  )

  const updateProfile = useCallback(
    (updater, path = null) => {
      commit((current) => ({ ...current, profile: { ...current.profile, ...updater } }), path)
    },
    [commit],
  )

  const setProfileProp = useCallback(
    (key, value) => {
      updateProfile({ [key]: value }, ['profile', key])
    },
    [updateProfile],
  )

  const setName = useCallback(
    (value) => {
      commit((current) => ({ ...current, name: value }), ['name'])
    },
    [commit],
  )

  /** Replace the whole document - used when switching template. */
  const replaceDocument = useCallback(
    (next) => {
      clearCoalescing()
      documentRef.current = next
      pastRef.current = []
      futureRef.current = []
      setDocument(next)
      setPast([])
      setFuture([])
      setSelectedId(null)
    },
    [clearCoalescing],
  )

  const selected = useMemo(
    () => document_.sections.find((section) => section.id === selectedId) || null,
    [document_, selectedId],
  )

  return {
    document: document_,
    sections: document_.sections,
    selected,
    selectedId,
    setSelectedId,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commit,
    undo,
    redo,
    addSection,
    updateSection,
    setSectionProp,
    removeSection,
    duplicateSection,
    moveSection,
    reorderSections,
    updateSite,
    setSiteProp,
    updateProfile,
    setProfileProp,
    setName,
    replaceDocument,
  }
}

/**
 * Coerce a document into the exact shape the server expects, so what the
 * editor sends and what the server stores cannot drift apart.
 */
export function normalizeForSave(document_) {
  const validated = validateDocument(document_)
  return {
    name: document_.name,
    site: validated.site,
    profile: validated.profile,
    sections: validated.sections,
  }
}
