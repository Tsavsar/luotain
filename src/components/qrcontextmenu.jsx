'use client'

import { useEffect, useState } from 'react'
import { DropdownMenu, DropdownOption } from '@/components/dropdown'

// ─── QR context menu ───
// Right-click a code in any view.
//
// The table had a row menu; the gallery and card views had nothing, so a code
// could only be edited or deleted from one of the three.
//
// It renders the app's own DropdownMenu and DropdownOption — the same
// components the row menu uses — rather than a second set of styled buttons.
// The only thing this adds is positioning: Dropdown anchors to a trigger
// element, and there isn't one here, the anchor is wherever the cursor was.

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

  // Spread onto any element representing a code.
  function bind(code) {
    return {
      onContextMenu: (e) => {
        e.preventDefault()
        setMenu({
          code,
          // Clamped, so a right-click near an edge doesn't open the menu
          // off-screen.
          x: Math.min(e.clientX, window.innerWidth - 200),
          y: Math.min(e.clientY, window.innerHeight - 170),
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
  if (!menu) return null

  function run(fn) {
    onClose()
    fn?.(menu.code)
  }

  return (
    <div
      // Fixed, because the coordinates come from a click event and those are
      // viewport-relative.
      style={{
        position: 'fixed',
        left: `${menu.x}px`,
        top: `${menu.y}px`,
        zIndex: 90,
      }}
      // The menu's own clicks must not reach the document listener that closes
      // it, or an option would close the menu before it ran.
      onClick={(e) => e.stopPropagation()}
    >
      {/* The same three options, in the same order, as the table's row menu —
          so right-clicking a card and using the row menu do the same things
          with the same words. */}
      {/* An explicit width: the menu defaults to 100% of its parent, and this
          dismiss the menu through the same path the row menu uses. */}
      <DropdownMenu width='188px' close={onClose}>
        <DropdownOption onClick={() => run(onOpen)}>View code</DropdownOption>
        <DropdownOption onClick={() => run(onEdit)}>Edit</DropdownOption>
        <DropdownOption danger onClick={() => run(onDelete)}>
          Delete
        </DropdownOption>
      </DropdownMenu>
    </div>
  )
}
