'use client'

import { useEffect, useState } from 'react'
import LinksStats from '@/components/linksstats'
import LinksTable from '@/components/linkstable'
import RecentlyDeletedLink from '@/components/recentlydeletedlink'
import { getMockLinksStats, getMockLinksTable } from '@/lib/mockAnalytics'

export default function LinksPage() {
  const [useMockData, setUseMockData] = useState(false)
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

  const stats = useMockData ? getMockLinksStats(selectedRange, []) : null

  // `links` used to be derived directly from getMockLinksTable() on
  // every render, which is why delete looked broken: mock data
  // regenerates the exact same list every time, so nothing a delete
  // did could ever make a row actually disappear. This is real state
  // now, re-seeded from the generator whenever the inputs that
  // should reset it change (mock toggled, range changed), but
  // otherwise left alone so a delete's own removal sticks.
  const [links, setLinks] = useState(null)
  useEffect(() => {
    setLinks(useMockData ? getMockLinksTable(selectedRange, []) : null)
  }, [useMockData, selectedRange])

  return (
    <>
      <div
        className='dashboard-section dashboard-section-3 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: '24px',
        }}
      >
        <LinksStats
          stats={stats}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      <div
        className='dashboard-section dashboard-section-4 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '32px',
          paddingBottom: '64px',
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <RecentlyDeletedLink />
          </div>

          {/* No mock toggle on, table renders its own empty state —
              same "no data yet" the real app shows before any links
              have been created, not a separate loading state. */}
          <LinksTable
            links={links}
            onEdit={(link) => {
              // TODO: route to the link's edit view once it exists
            }}
            onDelete={async (link) => {
              // Mock rows aren't real database rows — their id is
              // just the link's own url string (e.g.
              // "luo.io/swift-otter"), not a real cuid, so a fetch to
              // the real delete route would always 404. That 404 was
              // the actual "delete doesn't work": the button did
              // something, it just always failed silently against an
              // endpoint that could never recognize a mock id.
              // Simulated locally instead, matching what the mock
              // toggle already means everywhere else in this app: no
              // real network calls while it's on.
              if (useMockData) {
                setLinks((prev) => (prev || []).filter((l) => l.id !== link.id))
                return
              }

              const res = await fetch(`/api/links/${link.id}/delete`, {
                method: 'POST',
              })
              if (!res.ok) {
                // Thrown, not caught here — DeleteConfirmModal's own
                // onConfirm already wraps this in a try/catch that
                // re-enables its button and keeps the modal open on
                // failure. Catching it here too would just swallow
                // that behavior.
                throw new Error('Failed to delete link')
              }
              setLinks((prev) => (prev || []).filter((l) => l.id !== link.id))
            }}
          />
        </div>
      </div>

      <button
        onClick={() => setUseMockData((v) => !v)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: '#171717',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          zIndex: 999,
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: useMockData
              ? 'var(--success-base)'
              : 'var(--text-disabled)',
          }}
        />
        <span className='para-xs' style={{ color: 'white' }}>
          Mock data: {useMockData ? 'ON' : 'OFF'}
        </span>
      </button>
    </>
  )
}
