import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../lib/api'
import { normalizeForSave } from './useDocumentHistory'

/**
 * Reliable autosaving.
 *
 * The tricky part of autosave is not the debounce - it is making sure that a
 * slow request which was sent *before* a newer edit cannot land *after* it
 * and overwrite the newer edit on the server. Two mechanisms handle that:
 *
 *   1. A pending token. Every edit stamps the pending payload with a new
 *      token. When a request succeeds it only clears the pending payload if
 *      the token is still the one it sent. An edit that arrived mid-flight
 *      therefore survives and is sent again.
 *
 *   2. A sequence number. Only the newest sequence may update the visible
 *      save state, so a slow response cannot report "saved" over a newer
 *      "saving".
 *
 * A third detail matters for honesty of the indicator: the hook keeps track
 * of the exact payload that is known to be on the server. An edit that does
 * not change the document is not queued at all, and an edit that changes it
 * back to the server state cancels the pending save. Without this the
 * indicator would claim "saved" while a change was still queued.
 */

const DEBOUNCE_MS = 900

/**
 * A stable serialisation, so two payloads that differ only in key order
 * compare equal. The server returns objects in its own key order, and a
 * naive `JSON.stringify` comparison would then report a difference for a
 * document that has not actually changed.
 */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

export function useAutosave({ websiteId, document: document_, baseline = null, enabled = true }) {
  // idle     - nothing waiting to be saved
  // pending  - there are changes that have not been sent yet
  // saving   - a request is in flight
  // saved    - everything is on the server
  // error    - the last attempt failed; the changes are still queued
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  // Mirrors `error` for the async code paths, which must not close over a
  // stale render's value.
  const errorRef = useRef('')

  const sequence = useRef(0)
  const completed = useRef(0)
  // The payload that must eventually reach the server, and the token that
  // identifies it.
  const pending = useRef(null)
  const pendingToken = useRef(0)
  const timer = useRef(null)
  const inFlight = useRef(false)
  // The promise of the request that is currently running, so a caller that
  // needs the server to be up to date can wait for it.
  const inFlightPromise = useRef(Promise.resolve())
  const latest = useRef(document_)
  // The serialised payload that is known to be on the server.
  const saved = useRef(baseline)

  useEffect(() => {
    latest.current = document_
  }, [document_])

  useEffect(() => {
    // The server document arrives after the editor mounts. Adopt it as the
    // known-saved state so opening the editor does not trigger a pointless
    // write, but never move the marker backwards past a real save.
    if (baseline && !saved.current) saved.current = baseline
  }, [baseline])

  const send = useCallback(async () => {
    if (!websiteId || inFlight.current) return

    const payload = pending.current
    if (!payload) return

    const mySequence = ++sequence.current
    const myToken = pendingToken.current

    inFlight.current = true
    setState('saving')

    const request = (async () => {
      try {
        await apiRequest(`/websites/${websiteId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })

        // Only clear the pending payload if no newer edit arrived meanwhile.
        if (pendingToken.current === myToken) {
          pending.current = null
          saved.current = stableStringify(payload)
        }

        if (mySequence > completed.current) {
          completed.current = mySequence
          setError('')
          errorRef.current = ''
          // If another edit landed while this request was in flight, the
          // document is not fully saved yet - the follow-up request will
          // report the real state. Do not claim "saved" in the meantime.
          setState(pending.current ? 'pending' : 'saved')
        }
      } catch (requestError) {
        if (mySequence > completed.current) {
          const message = requestError.message || 'Could not save your changes.'
          setState('error')
          setError(message)
          errorRef.current = message
        }
        // The payload stays pending so a retry can send it again.
      } finally {
        inFlight.current = false

        // Something changed while the request was in flight: send it now.
        if (pending.current && pendingToken.current !== myToken) {
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => sendRef.current?.(), 250)
        }
      }
    })()

    inFlightPromise.current = request
    await request
  }, [websiteId])

  // A ref to `send`, so the follow-up request can be scheduled without the
  // callback referring to itself.
  const sendRef = useRef(send)
  useEffect(() => {
    sendRef.current = send
  }, [send])

  const schedule = useCallback(() => {
    if (!enabled || !websiteId) return

    const payload = normalizeForSave(latest.current)
    const serialized = stableStringify(payload)

    // The document matches what the server already has. There is nothing to
    // save, so the editor must not pretend there is an unsaved change.
    if (serialized === saved.current) {
      pending.current = null
      pendingToken.current += 1
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
      setState((current) => (current === 'error' ? 'error' : 'saved'))
      return
    }

    pending.current = payload
    pendingToken.current += 1
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(send, DEBOUNCE_MS)
    // There are now changes that are not on the server yet. The indicator
    // must say so, otherwise the user is told everything is saved while
    // their last edit is still queued.
    setState((current) => (current === 'error' ? 'error' : 'pending'))
  }, [enabled, send, websiteId])

  // Save whenever the document changes.
  useEffect(() => {
    if (!enabled || !websiteId) return undefined
    schedule()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [document_, enabled, schedule, websiteId])

  // Save immediately when the editor is closed or hidden.
  useEffect(() => {
    const flush = () => {
      if (!enabled || !websiteId || !pending.current) return
      if (timer.current) clearTimeout(timer.current)
      send()
    }

    const onVisibility = () => {
      if (window.document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('pagehide', flush)
    window.document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, send, websiteId])

  /** Save right now, bypassing the debounce. */
  const saveNow = useCallback(async () => {
    if (!enabled || !websiteId) return

    const payload = normalizeForSave(latest.current)
    const serialized = stableStringify(payload)

    if (serialized === saved.current && !pending.current) {
      // Nothing new to write, but a request may still be in flight with an
      // older payload. Wait for it, so the caller knows the server has the
      // current document.
      await inFlightPromise.current
      return
    }

    pending.current = payload
    pendingToken.current += 1
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    setState('pending')
    await send()
    // If an edit landed during the request, flush it too. The loop stops on
    // a failure so a broken connection cannot spin forever.
    while (pending.current && !errorRef.current) {
      await send()
    }
  }, [enabled, send, websiteId])

  /** Retry after a failure. */
  const retry = useCallback(() => {
    if (!pending.current) {
      pending.current = normalizeForSave(latest.current)
      pendingToken.current += 1
    }
    setState('pending')
    schedule()
  }, [schedule])

  return { state, error, saveNow, retry, isSaving: state === 'saving' }
}
