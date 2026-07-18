import EmptyStateIcon from './emptystateicon'

// ─── DashboardCards ───
// Matches Figma nodes 73:1086 (single card) and 73:1084 (the 2x2
// container). All four cards share one shell — Card below — differing
// only in title, column-label text, and whether the dropdown chevron
// shows (Sources doesn't have one). Empty-state body is identical
// across all four, reusing the same icon as the chart above it.
// .card-row (in globals.css) handles the column-on-mobile behavior,
// reusing the same 768px breakpoint already established for the
// legal pages elsewhere in this project.

function DropdownChevron() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M3.5 5.25L7 8.75L10.5 5.25'
        stroke='var(--text-soft)'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Card({ title, columnLabel, showDropdown = true }) {
  return (
    <div
      style={{
        background: 'var(--bg-default)',
        border: '1px solid var(--bg-surface)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        alignItems: 'center',
        flex: '1 0 0',
        minWidth: 0,
        height: '250px',
        padding: '14px 12px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 8px',
        }}
      >
        <p
          className='label-md'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <p
            className='para-xs'
            style={{
              color: 'var(--text-soft)',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {columnLabel}
          </p>
          {showDropdown && <DropdownChevron />}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <EmptyStateIcon />
        <p className='para-sm' style={{ color: 'var(--text-soft)', margin: 0 }}>
          No data available
        </p>
      </div>
    </div>
  )
}

export default function DashboardCards() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div className='card-row'>
        <Card title='Clicks' columnLabel='Short links' />
        <Card title='Sources' columnLabel='Visitors' showDropdown={false} />
      </div>
      <div className='card-row'>
        <Card title='Geography' columnLabel='Countries' />
        <Card title='Devices' columnLabel='Type' />
      </div>
    </div>
  )
}
