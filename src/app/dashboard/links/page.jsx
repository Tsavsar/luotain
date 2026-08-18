'use client'

import { useEffect, useState } from 'react'
import { useMockDataState } from '@/components/mockdatacontext'
import { useRouter } from 'next/navigation'
import LinksStats from '@/components/linksstats'
import UsageBanner from '@/components/usagebanner'
import LinksTable from '@/components/linkstable'
import RecentlyDeletedLink from '@/components/recentlydeletedlink'
import { slugOf } from '@/components/linktablehelpers'
import { toast } from '@/components/toast'
import {
  getMockLinksStats,
  getMockLinksTable,
  getMockTrash,
} from '@/lib/mockAnalytics'

// Mirrors the ranges the mock generator uses, so a real workspace and a mock
// one count the same window. null means "everything", which is what a range
// with no start should mean rather than an empty list.
function rangeStartFor(range) {
  const now = Date.now()
  const day = 24 * 3600 * 1000
  switch (range) {
    case 'Today': {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'Yesterday': {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return new Date(d.getTime() - day)
    }
    case 'Last 30 days':
      return new Date(now - 30 * day)
    case 'Last 90 days':
      return new Date(now - 90 * day)
    case 'All time':
      return null
    case 'Last 7 days':
    default:
      return new Date(now - 7 * day)
  }
}

export default function LinksPage() {
  const router = useRouter()
  // Shared across every page and persisted, so switching it on once
  // sticks instead of resetting on each navigation.
  const {
    useMockData,
    ready: mockReady,
    deletedUrls,
    deleteMockLink,
    recoverMockLink,
  } = useMockDataState()
  const [selectedRange, setSelectedRange] = useState('Last 7 days')

  // Real state, re-seeded from the generator only when the inputs
  // that should reset it change (mock toggled, range changed), so a
  // delete's own removal otherwise sticks.
  const [links, setLinks] = useState(null)
  useEffect(() => {
    // Wait until the saved mock preference is known — otherwise a
    // reload with mock on hits the network once for nothing.
    if (!mockReady) return
    let cancelled = false

    if (useMockData) {
      setLinks(getMockLinksTable(selectedRange, [], deletedUrls))
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
  }, [mockReady, useMockData, selectedRange, deletedUrls])

  // deletedUrls is passed through so the totals drop when something is
  // deleted — no link, nothing to report.
  // Real stats were literally null, so all three cards sat empty on every real
  // workspace — "Links created" never updated because nothing ever computed it.
  //
  // Derived from the links already loaded rather than fetched: the list is
  // right here and carries a click count per row, so a second request would ask
  // the server to recount what the page can add up itself.
  const stats = useMockData
    ? getMockLinksStats(selectedRange, [], deletedUrls)
    : links
      ? {
          totalClicks: links.reduce((sum, l) => sum + (l.clicks || 0), 0),
          // Counted WITHIN the selected range, matching what the mock stats do.
          // It was links.length, so the number never moved when the range
          // changed — which reads exactly like a stat that isn't updating.
          linksCreated: links.filter((l) => {
            const since = rangeStartFor(selectedRange)
            return !since || new Date(l.createdAt) >= since
          }).length,
          // Not computable from this list — a unique visitor needs the click
          // rows, not a per-link total. Left undefined so the card shows its
          // empty state rather than a number that would be wrong.
          uniqueVisitors: undefined,
        }
      : null

  // Extracted so edit and duplicate can refresh the table. It was inline in
  // the effect, which meant anything else needing a reload had to repeat the
  // fetch — and left it defined inside the effect, out of scope for the JSX.
  function load() {
    return fetch('/api/links')
      .then((res) => {
        if (!res.ok) throw new Error(`links list failed: ${res.status}`)
        return res.json()
      })
      .then((data) => setLinks(data.links ?? []))
      .catch((err) => {
        console.error('[LinksPage]', err)
        setLinks([])
      })
  }

  // Duplicating is a create with the same destination and a generated slug.
  // Leaving the slug blank is what asks the server for one — copying the
  // original's would collide, and appending "-2" invents a convention the rest
  // of the app doesn't use.
  async function handleDuplicate(link) {
    if (useMockData) {
      toast('Mock data is on — nothing was created')
      return
    }
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // `destination`, not `destinationUrl` — POST /api/links reads that
          // key. PATCH /api/links/[id] reads destinationUrl, which is how this
          // slipped through: the two endpoints name the same field differently.
          destination: link.destinationUrl || link.destination,
          title: link.title || null,
        }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(d?.error || `Couldn't duplicate (${res.status})`)
        return
      }
      toast('Link duplicated')
      await load()
    } catch (err) {
      console.error('[Links]', err)
      toast.error("Couldn't duplicate the link")
    }
  }

  async function handleDelete(link) {
    // Mock rows are display-only — their id is the link's own url
    // string (e.g. "luot.link/summer-sale"), which isn't a real cuid AND
    // contains a slash, so it can't even go in a URL path: a fetch to
    // /api/links/luot.link/summer-sale/delete doesn't resolve to the
    // [id] route at all, it just hangs. So while mock data is on,
    // this stays fully local: no fetch regardless.
    if (useMockData) {
      // Recorded in shared state rather than filtered out of this
      // page's list. The row disappearing is only part of a delete —
      // it also has to join the trash, leave the totals, and switch
      // its own detail page to the archived state. The effect above
      // re-seeds from the same source, so the row goes on its own.
      deleteMockLink(link.shortUrl)
      toast(`${link.shortUrl} moved to trash`, {
        action: {
          label: 'Undo',
          onClick: () => recoverMockLink(link.shortUrl),
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
          // column, and it MATTERS. This was a plain flex row with one child, so
          // direction never came up — adding the banner beside the stats laid
          // them out side by side and squashed both.
          flexDirection: 'column',
          // center was horizontal centring on a row. As a column it would
          // shrink both children to their content width, so it goes.
          alignItems: 'stretch',
          gap: '14px',
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        {/* Above the stats, because the limit is context for everything below
            it — finding out you're at 5 of 5 AFTER scrolling a full table is
            finding out too late. */}
        <UsageBanner linkCount={links?.length} />

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
          paddingBottom: '24px',
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
            if (useMockData) {
              toast('Mock data is on — nothing was changed')
              return
            }
            router.push(`/dashboard/create?edit=${link.id}`)
          }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>

      {/* Its own section at the foot of the page rather than tucked
          under the table. marginTop:auto is what pushes it down: the
          layout's <main> is a flex column at min-height 100vh, so the
          spare vertical space collects above this instead of below it.
          On a long list it simply follows the table; on a short one it
          settles at the bottom of the screen.

          The component returns null when the trash is empty, so this
          whole row collapses to nothing — no reserved height, no
          stranded gap at the bottom of the page. */}
      <div
        className='dashboard-section dashboard-section-5 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: 'auto',
          paddingTop: '24px',
          paddingBottom: '40px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <RecentlyDeletedLink
            count={useMockData ? getMockTrash(deletedUrls).length : undefined}
          />
        </div>
      </div>
    </>
  )
}
