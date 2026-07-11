'use client'

import { useState } from 'react'

export default function Inputfield({ lefticon, righticon, placeholder }) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        width: '380px',
        height: '40px',
        boxShadow: 'var(--shadow-xs)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 8px 10px 14px',
        gap: '8px',
        fontSize: '14px',
        color: 'var(--text-soft)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {lefticon}
      <input
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: 'var(--text-soft)',
        }}
      />
      {righticon}
    </div>
  )
}
