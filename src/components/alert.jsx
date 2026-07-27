// ─── Alert ───
// Two Figma nodes, one component:
//
//   variant='card' (default) — node 308:851. Small confirmation popup.
//     Icon + message in a neutral white card; the colour signal lives
//     in the icon alone, not a tinted background (one spot of colour).
//
//   variant='inline' — node 79:6910. A persistent inline notice with a
//     trailing action, e.g. "This link was deleted 28 days ago …
//     Recover". Flatter and quieter than the card: it sits in the page
//     rather than floating above it, so no border or shadow.
//
// Kept as one component because they're the same structure (icon +
// message + optional action) and only the surface differs. The card
// variant's behaviour is unchanged from before — same padding, radius,
// shadow, 20px icon and check-reveal animation — so existing usage
// needs no edits.
export default function Alert({ icon, message, action, variant = 'card' }) {
  const isInline = variant === 'inline'

  return (
    <div
      style={{
        display: 'flex',
        width: '100%', // 400px in the Figma frame, but that was just the
        // isolated artboard width — every other element on
        // this page fills its 360px container at 100%
        padding: isInline ? '6px 14px 6px 8px' : '8px 10px',
        alignItems: 'center',
        gap: '6px',
        // Design emits var(--radius-sm, 8px) for the inline node, but
        // this project's --radius-sm is 6px and --radius-md is 8px.
        // Matching the design's actual 8px; the Figma variable set and
        // globals.css have drifted on that token name.
        borderRadius: isInline ? 'var(--radius-md)' : 'var(--radius-lg)',
        border: isInline ? 'none' : '1px solid var(--stroke-soft)',
        background: isInline ? 'var(--bg-surface)' : 'var(--bg-default)',
        boxShadow: isInline ? 'none' : 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: '1 0 0',
          alignItems: 'center',
          gap: '6px',
          minWidth: 0,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: isInline ? '16px' : '20px',
            height: isInline ? '16px' : '20px',
          }}
          // check-reveal is NOT generic — it's a stroke-draw calibrated
          // to the checkmark path's real length (19 units) plus a
          // rotate. Running an info glyph through it would animate it
          // as though it were a checkmark being drawn, so it stays on
          // the card variant only.
          className={isInline ? undefined : 'check-reveal'}
        >
          {icon}
        </div>
        <p
          className={isInline ? 'para-xs' : 'para-sm'}
          style={{
            flex: '1 0 0',
            minWidth: 0,
            color: 'var(--text-strong)',
            margin: 0,
          }}
        >
          {message}
        </p>
      </div>

      {action ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            height: '16px',
          }}
        >
          {action}
        </div>
      ) : null}
    </div>
  )
}

// The trailing action for the inline variant. A real <button> so it's
// keyboard-reachable and announced as an action rather than as text —
// and it needs its own font-family, since native buttons don't inherit
// one.
export function AlertAction({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className='label-xs alert-action'
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: disabled ? 'default' : 'pointer',
        color: 'var(--text-strong)',
        textAlign: 'right',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// Not a Figma export — the design ships this as a flattened image, and
// an info glyph is standard enough to draw rather than hotlink an asset
// URL that expires in 7 days. Filled rather than outlined to match the
// drop shadow the design puts on it, which only reads on a solid shape.
export function AlertInfoIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
      <circle cx='8' cy='8' r='7' fill='var(--text-sub)' />
      <rect x='7.25' y='6.75' width='1.5' height='5' rx='0.75' fill='white' />
      <circle cx='8' cy='4.9' r='0.85' fill='white' />
    </svg>
  )
}
