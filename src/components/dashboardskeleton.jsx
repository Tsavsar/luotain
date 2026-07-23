// ─── DashboardSkeleton ───
// Mirrors the real dashboard's layout exactly — same max-widths,
// same padding, same section heights — so swapping to real content
// causes zero layout shift. Pulse animation is pure CSS (not JS),
// specifically so it stays smooth while the page is genuinely busy
// fetching data, per emil-design-eng's "CSS beats JS under load".

function Skeleton({ width, height, radius = 'var(--radius-md)', style }) {
  return (
    <div
      className='skeleton-pulse'
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--bg-surface)',
        ...style,
      }}
    />
  )
}

export default function DashboardSkeleton() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Menu row */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '36px 24px 24px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width='32px' height='32px' radius='var(--radius-full)' />
            <div
              style={{
                width: '1.5px',
                height: '20px',
                background: 'var(--bg-layer)',
              }}
            />
            <Skeleton width='24px' height='24px' radius='var(--radius-full)' />
            <Skeleton width='96px' height='20px' />
          </div>
          <Skeleton width='32px' height='32px' radius='var(--radius-full)' />
        </div>
      </div>

      {/* Nav row */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 24px 24px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Skeleton width='240px' height='36px' radius='48px' />
          <Skeleton width='110px' height='36px' radius='var(--radius-full)' />
        </div>
      </div>

      {/* Stats row — title/date row, then equal-width cards, matching
          the current card-based stats design. The shapes inside each
          card override Skeleton's default bg-surface fill to
          bg-subtle instead: a bg-surface shape sitting on a
          bg-surface card would just disappear into it. */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Skeleton width='70px' height='20px' />
            <Skeleton width='104px' height='20px' />
          </div>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              width: '100%',
              background: 'var(--bg-default)',
              border: '1px solid var(--stroke-soft)',
              borderRadius: '18px',
              padding: '3px',
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: '1 0 0',
                  minWidth: 0,
                  background: 'var(--bg-light)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <Skeleton
                  width='60px'
                  height='12px'
                  style={{ background: 'var(--bg-subtle)' }}
                />
                <Skeleton
                  width='40px'
                  height='20px'
                  style={{ background: 'var(--bg-subtle)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 24px',
        }}
      >
        <Skeleton width='100%' height='328px' radius='var(--radius-lg)' />
      </div>

      {/* Cards */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px' }}>
            <Skeleton
              width='100%'
              height='250px'
              radius='14px'
              style={{ flex: '1 0 0' }}
            />
            <Skeleton
              width='100%'
              height='250px'
              radius='14px'
              style={{ flex: '1 0 0' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Skeleton
              width='100%'
              height='250px'
              radius='14px'
              style={{ flex: '1 0 0' }}
            />
            <Skeleton
              width='100%'
              height='250px'
              radius='14px'
              style={{ flex: '1 0 0' }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
