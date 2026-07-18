'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Dropdown ───
// Shared positioning/open-close/click-outside logic for every
// dropdown in the app. `trigger` is whatever's already clickable
// (the org name, the column-header text, etc.) — this just wraps it
// and manages showing/hiding the panel.
export function Dropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div
          className='dropdown-panel'
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 50,
            transformOrigin: align === 'right' ? 'top right' : 'top left',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── DropdownMenu ─── the visual shell every dropdown panel sits in
export function DropdownMenu({ children, width = '220px' }) {
  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        borderRadius: '14px',
        boxShadow: '0 10px 20px 3px rgba(0, 0, 0, 0.04)',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        width,
      }}
    >
      {children}
    </div>
  )
}

// ─── DropdownOption ── individual selectable row. Hover and selected
// states are handled via CSS classes (globals.css) since inline
// styles can't express :hover.
export function DropdownOption({ children, selected, onClick }) {
  return (
    <div
      className={`dropdown-item${selected ? ' is-selected' : ''}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 14px 6px 12px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <p
        className='para-xs'
        style={{ flex: 1, color: 'var(--text-strong)', margin: 0 }}
      >
        {children}
      </p>
    </div>
  )
}
