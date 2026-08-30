'use client'

import { useEffect, useRef, useState } from 'react'

// ─── QR context menu ───
// Right-click a code in any view.
//
// The table had a row menu; the gallery and card views had nothing, so a code
// could only be edited or deleted from one of the three. This gives all three
// the same actions without adding a visible control to layouts whose whole
// point is showing the code.

export function useQrContextMenu() {
  const [menu, setMenu] = useState(null)

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e) => e.key === 'Escape' && close()
    // Capture on scroll: a menu anchored to a page point is wrong the moment
    // the page moves under it.
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', close)
    }
  }, [menu])

  // Spread onto any element that represents a code.
  function bind(code) {
    return {
      onContextMenu: (e) => {
        e.preventDefault()
        setMenu({
          code,
          // Clamped, so a right-click near an edge doesn't open the menu
          // off-screen.
          x: Math.min(e.clientX, window.innerWidth - 190),
          y: Math.min(e.clientY, window.innerHeight - 160),
        })
      },
    }
  }

  return { menu, bind, close: () => setMenu(null) }
}

export default function QrContextMenu({
  menu,
  onOpen,
  onEdit,
  onDelete,
  onClose,
}) {
  const confirmRef = useRef(false)
  const [confirming, setConfirming] = useState(false)

  // Reset between openings, or a menu closed mid-confirm reopens already
  // asking about a code you didn't choose.
  useEffect(() => {
    setConfirming(false)
    confirmRef.current = false
  }, [menu])

  if (!menu) return null

  function run(fn) {
    onClose()
    fn?.(menu.code)
  }

  return (
    <div
      role='menu'
      className='qr-context-menu'
      style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
      // The menu's own clicks must not reach the document listener that closes
      // it, or an option would close the menu before it ran.
      onClick={(e) => e.stopPropagation()}
    >
      <button type='button' role='menuitem' onClick={() => run(onOpen)}>
        Preview
      </button>
      <button type='button' role='menuitem' onClick={() => run(onEdit)}>
        Edit design
      </button>

      <span className='qr-context-rule' aria-hidden='true' />

      {/* Two presses, not a dialog. Deleting one code from a grid doesn't
          warrant a modal, but it does warrant more than a single click next to
          Edit. */}
      <button
        type='button'
        role='menuitem'
        className='qr-context-danger'
        onClick={() => {
          if (!confirming) {
            setConfirming(true)
            return
          }
          run(onDelete)
        }}
      >
        {confirming ? 'Click again to delete' : 'Delete'}
      </button>
    </div>
  )
}
