'use client'

import { useEffect, useState } from 'react'
import LinksStats from '@/components/linksstats'
import LinksTable from '@/components/linkstable'
import RecentlyDeletedLink from '@/components/recentlydeletedlink'
import { toast } from '@/components/toast'
import { getMockLinksStats, getMockLinksTable } from '@/lib/mockAnalytics'

export default function LinksPage() {
  const [useMockData, setUseMockData] = useState(false)
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

  const stats = useMockData ? getMockLinksStats(selectedRange, []) : null

  // Real state, re-seeded from the generator only when the inputs
  // that should reset it change (mock toggled, range changed), so a
  // delete's own removal otherwise sticks.
  const [links, setLinks] = useState(null)
  useEffect(() => {
    setLinks(useMockData ? getMockLinksTable(selectedRange, []) : null)
  }, [useMockData, selectedRange])

  async function handleDelete(link) {
    // Mock rows are display-only — their id is the link's own url
    // string (e.g. "luo.io/summer-sale"), which isn't a real cuid AND
    // contains a slash, so it can't even go in a URL path: a fetch to
    // /api/links/luo.io/summer-sale/delete doesn't resolve to the
    // [id] route at all, it just hangs. So while mock data is on,
    // this stays fully local: no fetch regardless.
    if (useMockData) {
      // Capture the removed row's index so undo can put it back
      // exactly where it was, not append it to the end — undo should
      // reverse the delete, not reorder the list.
      let removedIndex = -1
      setLinks((prev) => {
        const list = prev || []
        removedIndex = list.findIndex((l) => l.id === link.id)
        return list.filter((l) => l.id !== link.id)
      })
      toast(`${link.shortUrl} moved to trash`, {
        action: {
          label: 'Undo',
          onClick: () => {
            setLinks((prev) => {
              const list = prev || []
              if (list.some((l) => l.id === link.id)) return list
              const next = [...list]
              next.splice(
                removedIndex >= 0 ? removedIndex : next.length,
                0,
                link
              )
              return next
            })
          },
        },
      })
      return
    }

    // Real path — link.id here is a real cuid with no slashes.
    const res = await fetch(`/api/links/${link.id}/delete`, {
      method: 'POST',
    })
    if (!res.ok) {
      // Thrown, not caught here — DeleteConfirmModal's own handleConfirm
      // wraps this call in a try/catch that re-enables its button and
      // keeps the modal open on failure. Catching it here would just
      // swallow that.
      throw new Error('Failed to delete link')
    }
    setLinks((prev) => (prev || []).filter((l) => l.id !== link.id))
    toast(`${link.shortUrl} moved to trash`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          // Same endpoint the trash page's Recover uses — undo IS a
          // recover, just triggered from the toast instead of the
          // trash list.
          const recoverRes = await fetch(`/api/links/${link.id}/recover`, {
            method: 'POST',
          })
          if (recoverRes.ok) {
            setLinks((prev) => {
              const list = prev || []
              return list.some((l) => l.id === link.id) ? list : [link, ...list]
            })
          } else {
            toast.error(`Couldn't undo`)
          }
        },
      },
    })
  }

  return (
    <>
      <div
        className='dashboard-section dashboard-section-3 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: 0,
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
            onDelete={handleDelete}
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
