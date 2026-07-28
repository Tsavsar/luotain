'use client'

import { useState } from 'react'

export default function Inputfield({
  lefticon,
  righticon,
  placeholder,
  value,
  onChange,
  error,
  shaking,
  onKeyDown,
  // Blurs and fades JUST the text while a value is being replaced
  // programmatically — the create form's "generate slug" uses it so the
  // swap reads as a soft change instead of the characters snapping to
  // something else. Only the text moves, not the border or the shell,
  // which is why this lives here rather than as a wrapper around the
  // whole field. Optional and off by default, so nothing that already
  // uses this component changes.
  swapping = false,
}) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={shaking ? 'is-shaking' : ''}
      style={{
        width: '100%',
        height: 'fit-content',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-default)',
        border: error
          ? '1px solid var(--error-base)'
          : focused
            ? '1px solid var(--primary-base)'
            : hovered
              ? '1px solid var(--stroke-medium)'
              : '1px solid var(--stroke-soft)',
        boxShadow: error
          ? 'var(--focus-error)'
          : focused
            ? 'var(--focus-active)'
            : 'var(--shadow-xs)',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 8px 10px 14px',
        gap: '8px',
        fontSize: '14px',
        color: 'var(--text-strong)',
        fontFamily: 'var(--font-sans)',
        transition: 'border 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div
        style={{
          color:
            focused || value.length > 0
              ? 'var(--text-strong)'
              : 'var(--text-soft)',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s ease',
        }}
      >
        {lefticon}
      </div>
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          outline: 'none',
          flex: 1,
          border: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: value.length > 0 ? 'var(--text-strong)' : 'var(--text-soft)',
          // Enough blur that the characters are unreadable mid-swap, so
          // the old and new values are never both legible.
          filter: swapping ? 'blur(5px)' : 'none',
          opacity: swapping ? 0.5 : 1,
          transition: 'filter 0.13s ease, opacity 0.13s ease, color 0.15s ease',
        }}
      />
      {righticon}
    </div>
  )
}
