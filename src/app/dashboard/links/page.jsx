'use client'

import { useEffect, useState } from 'react'
import { useMockDataState } from '@/components/mockdatacontext'
import { useRouter } from 'next/navigation'
import LinksStats from '@/components/linksstats'
import LinksTable from '@/components/linkstable'
import RecentlyDeletedLink from '@/components/recentlydeletedlink'
import { slugOf } from '@/components/linktablehelpers'
import { toast } from '@/components/toast'
import { getMockLinksStats, getMockLinksTable } from '@/lib/mockAnalytics'

export default function LinksPage() {
  const router = useRouter()
  // Shared across every page and persisted, so switching it on once
  // sticks instead of resetting on each navigation.
  const { useMockData, ready: mockReady } = useMockDataState()
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

  const stats = useMockData ? getMockLinksStats(selectedRange, []) : null

  // Real state, re-seeded from the generator only when the inputs
  // that should reset it change (mock toggled, range changed), so a
  // delete's own removal otherwise sticks.
  const [links, setLinks] = useState(null)
  // How many links have been deleted in THIS mock session. Only used
  // while mock data is on, to decide whether "Recently deleted" shows.
  // With mock off the component asks the API instead, which is the
  // real answer.
  const [mockTrashCount, setMockTrashCount] = useState(0)
  useEffect(() => {
    // Wait until the saved mock preference is known — otherwise a
    // reload with mock on hits the network once for nothing.
    if (!mockReady) return
    let cancelled = false
    // Re-seeding restores every row, so anything "deleted" in the
    // previous mock session is back — the count has to reset with it.
    setMockTrashCount(0)

    if (useMockData) {
      setLinks(getMockLinksTable(selectedRange, []))
      return
    }

    // Real path. `null` while in flight rather than [] — the table
    // treats null as "not loaded" and [] as "genuinely no links", so
    // this doesn't flash the empty state before rows arrive.
    setLinks(null)
    fetch('/api/links')
      .then((res) => {
        if (!res.ok) throw new Error(`links list failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setLinks(data.links ?? [])
      })
      .catch((err) => {
        console.error('[LinksPage]', err)
        if (!cancelled) setLinks([])
      })

    return () => {
      cancelled = true
    }
  }, [mockReady, useMockData, selectedRange])

  async function handleDelete(link) {
    // Mock rows are display-only — their id is the link's own url
    // string (e.g. "luot.link/summer-sale"), which isn't a real cuid AND
    // contains a slash, so it can't even go in a URL path: a fetch to
    // /api/links/luot.link/summer-sale/delete doesn't resolve to the
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
      setMockTrashCount((n) => n + 1)
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
            setMockTrashCount((n) => Math.max(0, n - 1))
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
          {/* No mock toggle on, table renders its own empty state —
              same "no data yet" the real app shows before any links
              have been created, not a separate loading state. */}
          <LinksTable
            links={links}
            onOpen={(link) =>
              router.push(`/dashboard/links/${slugOf(link.shortUrl)}`)
            }
            onEdit={(link) => {
              // TODO: route to the link's edit view once it exists
            }}
            onDelete={handleDelete}
          />

          {/* Below the table, not above it. The component returns null
              when the trash is empty, so this row collapses to nothing
              rather than leaving a gap under the table — which is also
              why it isn't wrapped in anything that would reserve
              height on its own. */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <RecentlyDeletedLink
              count={useMockData ? mockTrashCount : undefined}
            />
          </div>
        </div>
      </div>
    </>
  )
}
