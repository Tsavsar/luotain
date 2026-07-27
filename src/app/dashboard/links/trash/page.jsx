'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/backbutton'
import TrashTable from '@/components/trashtable'
import { toast } from '@/components/toast'
import { slugOf } from '@/components/linktablehelpers'
import { getMockTrash } from '@/lib/mockAnalytics'
import { RECOVERY_WINDOW_DAYS } from '@/lib/linkrecovery'

export default function TrashPage() {
  const router = useRouter()
  // This page had NO mock toggle before, which was the root of the
  // recovery bug: it always rendered getMockTrash(), but Recover
  // called the real API with those mock ids ("trash-swift-otter").
  // Nothing in the database has those ids, so every single recovery
  // 404'd, rolled back, and showed an error toast. Mock data and real
  // endpoints were wired to each other.
  const [useMockData, setUseMockData] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (useMockData) {
      setItems(getMockTrash())
      setLoading(false)
      return
    }

    setLoading(true)
    fetch('/api/links/trash')
      .then((res) => {
        if (!res.ok) throw new Error(`trash list failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? [])
          setLoading(false)
        }
      })
      .catch((err) => {
        // Logged, not swallowed. A silent catch here is what made the
        // count endpoint's 500 look like a UI problem for several
        // rounds earlier in this build.
        console.error('[TrashPage]', err)
        if (!cancelled) {
          setItems([])
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [useMockData])

  async function handleRecover(item) {
    // Optimistic either way — recover isn't destructive, so removing
    // the row first and rolling back on failure is the right trade.
    // Capture the index so a rollback puts it back where it was rather
    // than appending it to the end.
    let removedIndex = -1
    setItems((prev) => {
      removedIndex = prev.findIndex((i) => i.id === item.id)
      return prev.filter((i) => i.id !== item.id)
    })

    // Mock ids aren't real database rows, so this must not touch the
    // network while mock data is on — same rule the links page's
    // delete follows.
    if (useMockData) {
      toast(`${item.shortUrl} recovered`)
      return
    }

    try {
      const res = await fetch(`/api/links/${item.id}/recover`, {
        method: 'POST',
      })
      if (!res.ok) {
        // 410 is its own case: the link is past the recovery window,
        // so putting the row back would imply it can still be
        // recovered when it can't.
        if (res.status === 410) {
          toast.error(
            `${item.shortUrl} is past the ${RECOVERY_WINDOW_DAYS}-day window`
          )
          return
        }
        throw new Error(`recover failed: ${res.status}`)
      }
      toast(`${item.shortUrl} recovered`)
    } catch (err) {
      console.error('[TrashPage]', err)
      setItems((prev) => {
        const next = [...prev]
        next.splice(removedIndex >= 0 ? removedIndex : next.length, 0, item)
        return next
      })
      toast.error(`Couldn't recover ${item.shortUrl}`)
    }
  }

  function handleViewDetails(item) {
    // Goes to the ordinary detail page, which now renders its own
    // archived state for a deleted link. The by-slug route used to
    // filter these out (deletedAt: null) so this could only ever
    // 404 — it serves them deliberately now, within the recovery
    // window.
    router.push(`/dashboard/links/${slugOf(item.shortUrl)}`)
  }

  return (
    <>
      <div
        className='dashboard-section dashboard-section-3 dashboard-page-padding'
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
            Recently deleted links will be permanently deleted after{' '}
            {RECOVERY_WINDOW_DAYS} days
          </p>
        </div>
      </div>

      <div
        className='dashboard-section dashboard-section-4 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '64px',
        }}
      >
        {/* While loading, an empty list would flash the "Nothing in the
            trash" empty state before the real rows arrive — saying
            nothing is better than briefly saying something false. */}
        <TrashTable
          items={loading ? null : items}
          onViewDetails={handleViewDetails}
          onRecover={handleRecover}
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
