'use client'

// ─── Settings skeletons ───
// Shown while a panel's data is in flight.
//
// Every block matches the real element's size, so nothing moves when the
// content arrives. A skeleton that's a different height than what replaces
// it is worse than no skeleton — it turns one wait into a wait plus a jump.
//
// Uses the project's existing .skeleton-pulse rather than a second
// animation.

function Block({ w, h, r = '8px', style }) {
  return (
    <div
      className='skeleton-pulse'
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: 'var(--bg-surface)',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

// The sidebar. Rendered immediately on desktop so the settings shell has
// its full shape before anything has loaded.
export function SettingsNavSkeleton() {
  return (
    <div
      aria-hidden='true'
      style={{
        width: '170px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '21px',
      }}
    >
      {[4, 7].map((count, g) => (
        <div
          key={g}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <Block w='96px' h='11px' r='4px' />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from({ length: count }).map((_, i) => (
              <Block key={i} w={`${68 + ((i * 23) % 52)}px`} h='16px' r='4px' />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// The General panel: avatar row, two fields, button.
export function SettingsGeneralSkeleton() {
  return (
    <div
      aria-hidden='true'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        width: '100%',
      }}
    >
      <Block w='104px' h='20px' r='4px' />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        <Block w='100%' h='62px' r='24px' />
        <Block w='100%' h='42px' r='var(--radius-lg)' />
        <Block w='100%' h='42px' r='var(--radius-lg)' />
      </div>
      <Block w='112px' h='32px' r='var(--radius-lg)' />
    </div>
  )
}
