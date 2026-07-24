'use client'

import { useState } from 'react'
import BackButton from '@/components/backbutton'
import TrashTable from '@/components/trashtable'
import { toast } from '@/components/toast'
import { getMockTrash } from '@/lib/mockAnalytics'

export default function TrashPage() {
  // No mock-data toggle here on purpose — unlike analytics/links,
  // trash isn't range-filterable or comparison-driven, so there's
  // nothing for it to demonstrate that the real list itself won't
  // already show once the actual delete/recover endpoints exist.
  const [items, setItems] = useState(() => getMockTrash())

  async function handleRecover(item) {
    // Optimistic: pull it off the list immediately rather than
    // waiting on the round-trip, since recover isn't destructive —
    // rolled back below if the request actually fails.
    setItems((prev) => prev.filter((i) => i.id !== item.id))

    try {
      const res = await fetch(`/api/links/${item.id}/recover`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to recover link')
      toast(`${item.shortUrl} recovered`)
    } catch (err) {
      // Put it back — the optimistic removal above assumed success.
      setItems((prev) => [...prev, item])
      toast.error(`Couldn't recover ${item.shortUrl}`)
    }
  }

  function handleViewDetails(item) {
    // TODO: wire up once there's a details view to send this to.
  }

  return (
    <>
      <div
        className='dashboard-section dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '36px',
          paddingBottom: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <BackButton />
          <p
            className='para-sm'
            style={{ color: 'var(--text-sub)', margin: 0 }}
          >
            Recently deleted links will be permanently deleted after 30 days
          </p>
        </div>
      </div>

      <div
        className='dashboard-section dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '64px',
        }}
      >
        <TrashTable
          items={items}
          onViewDetails={handleViewDetails}
          onRecover={handleRecover}
        />
      </div>
    </>
  )
}
