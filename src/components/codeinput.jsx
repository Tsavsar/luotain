'use client'

import { useState, useRef } from 'react'

// ─── CodeInput ───
// Verification code input — N individual cells (default 5, matching
// Figma node 50:17406). Each cell tracks its OWN focus state, so only
// the cell currently being typed into gets the active border/ring —
// not all cells at once. That's the "cursor position" pattern used by
// Stripe, 2FA prompts, etc: it shows exactly where the next digit lands.
// Shake-on-error now lives HERE (on the whole row), not on the submit
// button — reuses the existing .is-shaking keyframe from globals.css.
export default function CodeInput({
  length = 5,
  value,
  onChange,
  error,
  onComplete,
}) {
  const [focusedIndex, setFocusedIndex] = useState(null)
  const inputRefs = useRef([])

  // value is one string, e.g. "48" while typing, "48291" once complete.
  // Split it into per-cell characters, padding empty cells with ''.
  const digits = value
    .padEnd(length, ' ')
    .split('')
    .map((d) => (d === ' ' ? '' : d))

  function updateDigit(index, char) {
    const newDigits = [...digits]
    newDigits[index] = char
    const newValue = newDigits.join('').trimEnd()
    onChange(newValue)

    if (newValue.length === length && onComplete) {
      onComplete(newValue)
    }
  }

  function handleChange(e, index) {
    const char = e.target.value.slice(-1) // only keep the most recently typed character
    if (!/^[0-9]?$/.test(char)) return // digits only, ignore anything else

    updateDigit(index, char)

    // auto-advance to the next cell once a digit is entered —
    // or, if this was the LAST cell, blur it instead so focus
    // doesn't just sit there once the code is complete
    if (char) {
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      } else {
        inputRefs.current[index]?.blur()
      }
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // current cell has a value — just clear it, stay put
        updateDigit(index, '')
      } else if (index > 0) {
        // current cell already empty — step back and clear the previous one
        updateDigit(index - 1, '')
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, length)
    onChange(pasted)

    if (pasted.length === length && onComplete) {
      onComplete(pasted)
    }

    // land focus right after the last pasted digit
    const nextIndex = Math.min(pasted.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      className={error ? 'is-shaking' : ''}
      style={{ display: 'flex', gap: '8px', width: '100%' }}
    >
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index

        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digits[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            onPaste={handlePaste}
            style={{
              flex: 1,
              height: '56px',
              width: '100%',
              textAlign: 'center',
              fontSize: '20px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-strong)',
              background: 'var(--bg-default)',
              border: error
                ? '1px solid var(--error-base)'
                : isFocused
                  ? '1px solid var(--primary-base)'
                  : '1px solid var(--stroke-soft)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: error
                ? 'var(--focus-error)'
                : isFocused
                  ? 'var(--focus-active)'
                  : 'var(--shadow-xs)',
              outline: 'none',
              transition: 'border 0.15s ease, box-shadow 0.15s ease',
            }}
          />
        )
      })}
    </div>
  )
}
