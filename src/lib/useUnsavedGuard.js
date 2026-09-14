'use client'

import { useEffect, useRef } from 'react'

// ─── Unsaved changes guard ───
// Catches someone leaving a half-filled form and hands the decision back to
// them.
//
// Next's App Router has no cancellable navigation event, so there's nothing to
// hook into the way the old Pages router let you. This intercepts the CLICK
// instead, in the capture phase, before the link or button has done anything.
// Slightly blunt, but it's the only point where navigation can still be
// stopped.
//
// Two exits, two mechanisms, because the browser won't let one cover both:
//   - in-app links and buttons  -> our own modal, via onAttempt
//   - tab close, reload, back   -> the browser's native dialog, via
//                                  beforeunload, which cannot be styled and
//                                  cannot be replaced

export default function useUnsavedGuard({ dirty, onAttempt, ignore }) {
  // Held in refs so the listeners don't need re-binding every keystroke. A
  // form goes dirty on the first character typed, and re-registering a
  // document-level capture listener on every render would be wasteful and
  // would race with the click it's meant to catch.
  const dirtyRef = useRef(dirty)
  const onAttemptRef = useRef(onAttempt)
  const ignoreRef = useRef(ignore)

  useEffect(() => {
    dirtyRef.current = dirty
    onAttemptRef.current = onAttempt
    ignoreRef.current = ignore
  }, [dirty, onAttempt, ignore])

  useEffect(() => {
    function onClick(e) {
      if (!dirtyRef.current) return

      // Left click only. Middle click and cmd-click open a new tab, which
      // leaves this page exactly where it is, so there's nothing to warn
      // about.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }

      const el = e.target?.closest?.('a[href], [data-nav-exit]')
      if (!el) return

      // Anything inside the form itself, or the modal we're about to show.
      // Without this the guard would fire on its own "Leave" button.
      if (el.closest?.('[data-unsaved-safe]')) return
      if (ignoreRef.current?.(el)) return

      const href = el.getAttribute?.('href')
      if (href) {
        // Same-page anchors and external protocols don't unmount anything.
        if (href.startsWith('#') || /^(mailto|tel):/i.test(href)) return
        if (el.target === '_blank') return
      }

      e.preventDefault()
      e.stopPropagation()

      // The intended destination goes back to the caller, so "Leave" can
      // actually go where the person was trying to go rather than dumping
      // them somewhere generic.
      onAttemptRef.current?.(href || el.dataset?.navExit || null)
    }

    // Capture, so this runs before React's own handlers and before any
    // router push the element would have triggered.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // Tab close, reload and browser back. The message is ignored by every
  // modern browser, which shows its own wording, but preventDefault is what
  // makes the dialog appear at all.
  useEffect(() => {
    function onBeforeUnload(e) {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
}
