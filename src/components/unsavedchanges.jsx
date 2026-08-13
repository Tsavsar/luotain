'use client'

import { useEffect, useRef, useState } from 'react'
import Alert, { AlertAction, AlertInfoIcon } from '@/components/alert'

// ─── Unsaved changes ───
// The guard that stops someone walking away from staged edits, plus the banner
// that says so.
//
// Extracted from Account → General rather than copied to each page that gained a
// Save button. It's two different exits handled two different ways, and getting
// one of them subtly wrong on one page is exactly the kind of thing nobody
// notices until they lose work.
//
// `path` is the page's own route. Navigation WITHIN it isn't leaving, so it
// shouldn't warn — without this the banner fires on a same-page anchor.
export function useUnsavedChanges(dirty, path) {
  const [warnOpen, setWarnOpen] = useState(false)
  const [warnShaking, setWarnShaking] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // A real page unload — tab close, refresh, an external link. Only
  // beforeunload catches these, and the browser shows its own dialog, which
  // can't be styled.
  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // In-app navigation is a click that never reaches the network, so
  // beforeunload never fires for it. Caught in the capture phase, before the
  // router sees it, and answered with the banner instead.
  useEffect(() => {
    if (!dirty) return
    function onClick(e) {
      const link = e.target.closest?.('a[href]')
      if (!link) return
      const href = link.getAttribute('href')
      // Only internal navigation AWAY from this page. An anchor, a new tab or
      // an external link isn't losing anything.
      if (!href || !href.startsWith('/') || href.startsWith(path)) return
      if (link.target === '_blank' || e.metaKey || e.ctrlKey) return

      e.preventDefault()
      e.stopPropagation()
      setWarnOpen(true)
      // Re-shakes on every attempt. A banner that's already open and does
      // nothing when you try again reads as broken.
      setWarnShaking(true)
      timers.current.push(setTimeout(() => setWarnShaking(false), 400))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [dirty, path])

  // Saving or discarding resolves it, so the banner closes on its own rather
  // than lingering after the reason for it is gone.
  useEffect(() => {
    if (!dirty) setWarnOpen(false)
  }, [dirty])

  return { warnOpen, warnShaking }
}

// Drops down when there's something unsaved. The same Alert as the deleted-link
// notice, so an inline warning looks the same wherever it appears.
export function UnsavedBanner({ open, shaking, onDiscard, disabled }) {
  return (
    <div
      className={`unsaved-banner${open ? ' is-open' : ''}${shaking ? ' is-shaking' : ''}`}
      // Width is in CSS, not here — an inline cap can't be undone by a media
      // query, and this needs to go full width on mobile.
      style={{ width: '100%' }}
    >
      <Alert
        variant='inline'
        icon={<AlertInfoIcon />}
        message='You have unsaved changes'
        action={
          <AlertAction onClick={onDiscard} disabled={disabled}>
            Discard
          </AlertAction>
        }
      />
    </div>
  )
}
