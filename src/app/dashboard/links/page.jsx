'use client'

import { useState } from 'react'
import LinksStats from '@/components/linksstats'
import LinksTable from '@/components/linkstable'
import RecentlyDeletedLink from '@/components/recentlydeletedlink'
import { getMockLinksStats, getMockLinksTable } from '@/lib/mockAnalytics'

export default function LinksPage() {
  const [useMockData, setUseMockData] = useState(false)
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

  const stats = useMockData ? getMockLinksStats(selectedRange, []) : null
  const links = useMockData ? getMockLinksTable(selectedRange, []) : null

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
              // Note: the row won't disappear from view yet even on
              // success — `links` above comes from mock data, not a
              // real fetch, so there's nothing here to remove it
              // from. That's the read-side, still to be wired up
              // once there's a route to fetch real links from.
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
