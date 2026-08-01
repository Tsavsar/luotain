'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from './toast'

// ─── CopyButton ───
// Copies `value` and swaps its icon to a checkmark for a moment.
//
// Built as one component because there are four copy buttons in the app —
// the links table, the data cards, the link detail page and the QR
// lightbox — and the swap timing, the reset window and the "did it
// actually copy" handling should not be re-decided at each one.
//
// The icons come in as props so each site keeps its own sizing and
// colour: the table's copy glyph is 14px on --text-soft, the lightbox's
// is 16px on white.

const REVERT_MS = 1600

export default function CopyButton({
  value,
  icon,
  checkIcon,
  label = 'Copy',
  copiedLabel = 'Copied',
  toastMessage = 'Copied to clipboard',
  className,
  style,
  // Fired on a successful copy. Used by the data-card rows, whose copy
  // button only exists while hovered — they hold their actions open for a
  // moment so the check isn't unmounted before it's seen.
  onCopied,
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  // Cleared on unmount, or a pending revert fires against a component
  // that's gone — easy to hit here since the lightbox unmounts on close.
  useEffect(() => {
    return () => clearTimeout(timer.current)
  }, [])

  async function handleCopy() {
    try {
      // Can genuinely fail: no clipboard API on insecure origins, and
      // some browsers refuse without a user gesture they recognise. The
      // check shouldn't appear if nothing was copied.
      await navigator.clipboard?.writeText(value)
      setCopied(true)
      onCopied?.()
      if (toastMessage) toast(toastMessage)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), REVERT_MS)
    } catch (err) {
      console.error('[CopyButton]', err)
      toast.error("Couldn't copy to clipboard")
    }
  }

  return (
    <button
      type='button'
      onClick={(e) => {
        // Rows are clickable in the links table, so a copy must not also
        // navigate. Stopping it here means no caller has to remember.
        e.stopPropagation()
        handleCopy()
      }}
      aria-label={copied ? copiedLabel : label}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        ...style,
      }}
    >
      <span className='icon-swap' data-state={copied ? 'b' : 'a'}>
        <span className='icon-swap-item' data-icon='a'>
          {icon}
        </span>
        <span className='icon-swap-item' data-icon='b'>
          {checkIcon || <DefaultCheckIcon />}
        </span>
      </span>
    </button>
  )
}

// Falls back to this when no checkIcon is passed. currentColor so it
// inherits whatever the button sits in, same as the icons it replaces.
function DefaultCheckIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.5 8.5 6.5 11.5 12.5 4.5'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
