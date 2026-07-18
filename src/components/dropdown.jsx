'use client'

import {
  useState,
  useRef,
  useEffect,
  cloneElement,
  isValidElement,
} from 'react'

export function Dropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const close = () => setOpen(false)

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
          {isValidElement(children)
            ? cloneElement(children, { close })
            : children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenu({ children, width = '220px', close }) {
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
      {Array.isArray(children)
        ? children.map((child) =>
            isValidElement(child) ? cloneElement(child, { close }) : child
          )
        : isValidElement(children)
          ? cloneElement(children, { close })
          : children}
    </div>
  )
}

export function DropdownOption({ children, selected, danger, onClick, close }) {
  return (
    <div
      className={`dropdown-item${selected ? ' is-selected' : ''}${danger ? ' is-danger' : ''}`}
      onClick={() => {
        onClick?.()
        close?.()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 14px 6px 12px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <p
        className='para-xs'
        style={{
          flex: 1,
          color: danger ? 'var(--error-base)' : 'var(--text-strong)',
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  )
}
