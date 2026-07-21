'use client'

import { useState } from 'react'
import LinksStats from '@/components/linksstats'
import LinksTable from '@/components/linkstable'
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
        {/* No mock toggle on, table renders its own empty state —
            same "no data yet" the real app shows before any links
            have been created, not a separate loading state. */}
        <LinksTable
          links={links}
          onEdit={(link) => {
            // TODO: route to the link's edit view once it exists
          }}
          onDelete={(link) => {
            // TODO: wire up the real delete call once it exists
          }}
        />
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
