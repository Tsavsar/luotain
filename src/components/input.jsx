'use client'

import { useState } from 'react'

export default function Inputfield({
  lefticon,
  righticon,
  placeholder,
  value,
  onChange,
  error,
  onKeyDown,
}) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: 'fit-content',
        boxShadow: 'var(--shadow-xs)',
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
        color: focused
          ? 'var(--text-strong)'
          : hovered
            ? 'var(--text-strong)'
            : 'var(--text-strong)',
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
        }}
      />
      {righticon}
    </div>
  )
}
