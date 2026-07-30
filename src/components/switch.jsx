'use client'

// ─── Switch ───
// A real toggle rather than a button that reports state in its label.
// Built as its own component because the theme control in the dashboard
// layout is currently a button too and wants exactly this.
//
// A real <button> with role='switch' and aria-checked, so it's
// keyboard-operable and announced as a toggle with an on/off state
// rather than as something you press.
export default function Switch({
  checked,
  onChange,
  label,
  disabled,
  tone = 'success',
  // 'sm' matches the 29x16 toggle in the QR designer, which sits in a
  // dense settings row rather than as a standalone control.
  size = 'md',
  // Keeps `label` for assistive tech but renders no visible text — for
  // rows where a nearby heading is already the visible label and
  // repeating it would just be noise on screen.
  hideLabel = false,
}) {
  const sm = size === 'sm'
  const WIDTH = sm ? 29 : 34
  const HEIGHT = sm ? 16 : 20
  const KNOB = sm ? 12 : 14
  const PAD = 2

  const onColor =
    tone === 'primary' ? 'var(--primary-base)' : 'var(--success-base)'

  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span
        aria-hidden='true'
        style={{
          position: 'relative',
          flexShrink: 0,
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          borderRadius: 'var(--radius-full)',
          background: checked ? onColor : 'var(--bg-subtle)',
          transition: 'background 0.2s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: `${PAD}px`,
            left: `${PAD}px`,
            width: `${KNOB}px`,
            height: `${KNOB}px`,
            borderRadius: 'var(--radius-full)',
            background: 'white',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
            // Moved with transform rather than by animating `left`:
            // transform is composited, so the knob doesn't trigger
            // layout on every frame of the slide.
            transform: checked
              ? `translateX(${WIDTH - KNOB - PAD * 2}px)`
              : 'translateX(0)',
            transition: 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      </span>

      {label && !hideLabel ? (
        <span
          className='para-xs'
          style={{ color: 'var(--text-sub)', whiteSpace: 'nowrap' }}
        >
          {label}
        </span>
      ) : null}
    </button>
  )
}
