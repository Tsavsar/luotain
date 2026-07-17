// ─── StatsSegment ───
// Matches Figma node 73:971. This is deliberately the EMPTY state —
// every value is "-" and no trend badges render, matching what the
// Figma file itself shows (the badges exist in the design but are
// set to opacity:0 there too — this is the intended first-run look,
// not a placeholder standing in for something unfinished).
//
// Metric accepts an optional `trend` prop so real analytics data can
// be wired in later without rebuilding this component — for now
// every call site below just omits it, which is what correctly
// produces the dash-only empty state.

function ChevronIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M5 7.5L10 12.5L15 7.5'
        stroke='var(--text-soft)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Metric({ label, value, trend, width }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-start',
        width: width || 'auto',
      }}
    >
      <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
        {label}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: 'flex-start',
        }}
      >
        <p
          className='label-lg'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {value || '-'}
        </p>

        {/* Trend badge — only renders once real trend data exists.
            This is what stays invisible in the empty state, matching
            Figma's own opacity:0 treatment for the same element. */}
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
              borderRadius: '8px',
              background: 'var(--bg-default)',
              border: '0.75px solid var(--stroke-soft)',
              boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
            }}
          >
            {trend.dotColor && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: trend.dotColor,
                }}
              />
            )}
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: trend.color,
              }}
            >
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StatsSegment() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', gap: '42px', alignItems: 'flex-start' }}>
        <Metric label='Total clicks' width='76px' />
        <Metric label='Total scans' />
        <Metric label='Unique visitors' />
        <Metric label='Top country' />
      </div>

      {/* Date filter — inert for now, same "shell first, wire up
          later" pattern as the nav dropdown/avatar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 0',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <p
          className='para-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          Last 7 days
        </p>
        <ChevronIcon />
      </div>
    </div>
  )
}
