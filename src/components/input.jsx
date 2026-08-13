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
  // Read-only rather than disabled: the value still needs to be
  // selectable and copyable (an email address especially), and a disabled
  // input is skipped by keyboard navigation and often unreadable to
  // screen readers. This looks inert and can't be typed into, but the text
  // is still reachable.
  readOnly = false,
  // Recolours the focus ring. Separate from `error`, which means "this value
  // is invalid" and paints a red border at rest — this field isn't invalid
  // while it's being typed, it's just destructive, and the focus state is
  // where that belongs.
  tone = 'default',
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
        // Filled rather than white, which is the conventional signal for a
        // field you can read but not edit. --bg-layer (#f5f5f5) rather than
        // --bg-surface (#f7f7f7): one step further from white, so it reads
        // as inert beside the editable field. At two hex values from white,
        // surface looked like an editable field with a tint.
        backgroundColor: readOnly ? 'var(--bg-layer)' : 'var(--bg-default)',
        border: error
          ? '1px solid var(--error-base)'
          : readOnly
            ? // Transparent rather than none: no visible stroke, but the box
              // keeps its 1px so a read-only field is exactly as tall as an
              // editable one beside it. Dropping the border outright would
              // make it 2px shorter and the two would no longer line up.
              '1px solid transparent'
            : focused
              ? tone === 'error'
                ? '1px solid var(--error-base)'
                : '1px solid var(--primary-base)'
              : hovered
                ? '1px solid var(--stroke-medium)'
                : '1px solid var(--stroke-soft)',
        boxShadow: error
          ? 'var(--focus-error)'
          : readOnly
            ? // Flat. The shadow lifts a field off the page to say "you can
              // type here", which is the opposite of what this one means.
              'none'
            : focused
              ? tone === 'error'
                ? 'var(--focus-error)'
                : 'var(--focus-active)'
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
      {/* Rendered only when there IS an icon. Unconditionally, the empty
          div still counts as a flex child, so the parent's 8px gap
          applied to it and every iconless field picked up 22px of left
          space instead of 14px. */}
      {lefticon ? (
        <div
          style={{
            // Read-only greys the icon too. A read-only field always has a
            // value, so the rule below would push its icon to text-strong
            // and leave a dark icon sitting beside grey text.
            color: readOnly
              ? 'var(--text-sub)'
              : focused || value.length > 0
                ? 'var(--text-strong)'
                : 'var(--text-soft)',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s ease',
          }}
        >
          {lefticon}
        </div>
      ) : null}
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          outline: 'none',
          flex: 1,
          // minWidth 0, or the input refuses to shrink below its intrinsic
          // width and pushes anything after it out of the box. In a narrow
          // field — the 111px role picker — that squeezed the chevron clean
          // off the right edge, so the dropdown had no affordance at all.
          minWidth: 0,
          border: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: readOnly
            ? 'var(--text-sub)'
            : value.length > 0
              ? 'var(--text-strong)'
              : 'var(--text-soft)',
          cursor: readOnly ? 'default' : 'text',
          // Enough blur that the characters are unreadable mid-swap, so
          // the old and new values are never both legible.
          filter: swapping ? 'blur(5px)' : 'none',
          opacity: swapping ? 0.5 : 1,
          transition: 'filter 0.13s ease, opacity 0.13s ease, color 0.15s ease',
        }}
      />
      {/* flexShrink 0, so it can't be squeezed to nothing by a long value. */}
      {righticon ? (
        <span style={{ display: 'flex', flexShrink: 0 }}>{righticon}</span>
      ) : null}
    </div>
  )
}
