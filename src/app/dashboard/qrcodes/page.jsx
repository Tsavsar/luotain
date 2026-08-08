'use client'

import { useEffect, useState } from 'react'
import QrDesigner, { QrCode, QrLightbox } from '@/components/qrdesigner'
import Modal from '@/components/modal'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'
import { getMockQrCodes } from '@/lib/mockAnalytics'
import StatsCards from '@/components/statscards'
import { QrTable, QrCards, QrGallery } from '@/components/qrviews'
import SegmentedTabs from '@/components/segmentedtabs'
import useFlip from '@/components/useflip'

// ─── QR codes ───
//
// Cards rather than a table, for the same reason the schema gives a QR its own
// slug: a QR's identity is visual and physical. A row reading
// "luot.link/sw-summer · 612 · 12th August" tells you nothing about which
// sticker in the real world that is. The code itself is what you recognise.
//
// Flat rather than grouped by link, so two placements on the same link sit side
// by side with different numbers — the comparison the separate slug exists for,
// visible without any grouping UI.

// The real assets. Their #e8e8e8 is swapped for currentColor so the switcher's
// active and inactive colours reach them — a fixed fill would leave all three
// looking identically selected.
function TableIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 20 20'
      aria-hidden='true'
    >
      <g fill='currentColor'>
        <line
          x1='3'
          y1='13'
          x2='17'
          y2='13'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <line
          x1='3'
          y1='17'
          x2='17'
          y2='17'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <rect
          x='3'
          y='3'
          width='14'
          height='6'
          rx='1.5'
          ry='1.5'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          fill='currentColor'
        />
      </g>
    </svg>
  )
}

function CardsIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 20 20'
      aria-hidden='true'
    >
      <g fill='currentColor'>
        <rect
          x='3'
          y='4'
          width='4'
          height='4'
          rx='1'
          ry='1'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          fill='currentColor'
        />
        <rect
          x='3'
          y='12'
          width='4'
          height='4'
          rx='1'
          ry='1'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          fill='currentColor'
        />
        <line
          x1='11'
          y1='6'
          x2='17'
          y2='6'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <line
          x1='11'
          y1='14'
          x2='17'
          y2='14'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
      </g>
    </svg>
  )
}

function GalleryIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 20 20'
      aria-hidden='true'
    >
      <g fill='currentColor'>
        <path
          d='m3,7v-1c0-1.6569,1.3431-3,3-3h1'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <path
          d='m7,17h-1c-1.6569,0-3-1.3431-3-3v-1'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <path
          d='m17,13v1c0,1.6569-1.3431,3-3,3h-1'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <path
          d='m13,3h1c1.6569,0,3,1.3431,3,3v1'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <rect
          x='6.5'
          y='6.5'
          width='2'
          height='2'
          fill='currentColor'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <rect
          x='11.5'
          y='6.5'
          width='2'
          height='2'
          transform='translate(25 15) rotate(180)'
          fill='currentColor'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <rect
          x='6.5'
          y='11.5'
          width='2'
          height='2'
          fill='currentColor'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <rect
          x='11.5'
          y='11.5'
          width='2'
          height='2'
          transform='translate(25 25) rotate(180)'
          fill='currentColor'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
      </g>
    </svg>
  )
}

function CardSkeleton() {
  return (
    <div
      aria-hidden='true'
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        padding: '10px',
      }}
    >
      <div
        className='skeleton-pulse'
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <div
          className='skeleton-pulse'
          style={{
            width: '108px',
            height: '13px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '136px',
            height: '11px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '62px',
            height: '15px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
      </div>
    </div>
  )
}

export default function QrCodesPage() {
  const { useMockData, ready: mockReady, deletedUrls } = useMockDataState()
  const [codes, setCodes] = useState(null)
  // Two pieces of state, not one. `viewing` is the code whose design the
  // lightbox renders; `viewerOpen` is whether it's showing.
  //
  // Clearing `viewing` on close was a bug: every prop went undefined, QrCode
  // fell back to its default URL, and a completely different little code
  // rendered for the length of the exit animation. The design has to survive
  // until the exit finishes, so only the boolean flips on close.
  const [viewing, setViewing] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  // The code being restyled, plus its working design. Held separately from
  // `viewing` so cancelling leaves the original untouched — editing in place
  // would mean a discarded change had already altered the card behind the
  // dialog.
  // Which layout. Persisted, because it's a preference rather than a mode —
  // having to re-pick it on every visit is the thing that makes a view switcher
  // annoying instead of useful.
  const [view, setView] = useState('cards')
  const [range, setRange] = useState('Last 7 days')
  // The morph. Items are tracked by id across all three layouts, so switching
  // animates each code from where it was to where it lands rather than fading
  // one screen out and another in.
  //
  // This replaced a cross-fade plus a lagging `renderedView` state. Neither is
  // needed: the layout changes in a single frame and the movement carries the
  // change, so there's no outgoing view to hold on to.
  const { capture, register } = useFlip(view)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  function openViewer(code) {
    setViewing(code)
    setViewerOpen(true)
  }

  function closeViewer() {
    setViewerOpen(false)
    // `viewing` is deliberately left alone. It's cleared on the next open, and
    // holding it means the exit animates the code that was actually being
    // looked at.
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('luotain:qr-view')
      if (saved === 'table' || saved === 'cards' || saved === 'gallery') {
        setView(saved)
        // No morph on the initial read — there's no previous layout to animate
        // from, and nothing has been measured.
      }
    } catch {
      // Private browsing throws on access rather than returning null. The
      // default view is a fine fallback.
    }
  }, [])

  function changeView(next) {
    if (next === view) return
    // Read every item's position BEFORE the layout changes. This has to happen
    // here rather than in an effect — by the time an effect runs React has
    // already committed the new layout and the old positions are gone.
    capture()
    setView(next)
    try {
      window.localStorage.setItem('luotain:qr-view', next)
    } catch {}
  }

  useEffect(() => {
    // Wait until the saved mock preference is known, or a reload with mock on
    // hits the network once for nothing.
    if (!mockReady) return
    let cancelled = false

    if (useMockData) {
      setCodes(getMockQrCodes(deletedUrls))
      return
    }

    // null while in flight rather than [] — the empty state is a real message
    // ("No QR codes yet") and flashing it before the data lands would be
    // telling someone something false.
    setCodes(null)
    fetch('/api/qrcodes')
      .then((res) => {
        if (!res.ok) throw new Error(`qr codes fetch failed: ${res.status}`)
        return res.json()
      })
      .then((d) => {
        if (!cancelled) setCodes(d.qrCodes ?? [])
      })
      .catch((err) => {
        console.error('[QrCodesPage]', err)
        if (!cancelled) setCodes([])
      })

    return () => {
      cancelled = true
    }
  }, [mockReady, useMockData, deletedUrls])

  function startEditing(code) {
    setEditing(code)
    setDraft({
      color: code.color,
      markerColor: code.markerColor,
      pattern: code.pattern,
      branding: code.branding,
    })
    // The lightbox closes as the dialog opens — two overlays at once would
    // stack, and the designer contains its own preview anyway.
    setViewerOpen(false)
  }

  async function handleDelete(code) {
    // No confirmation dialog here yet, and that's a gap worth naming: deleting
    // a QR is a one-way door — the slug frees immediately and anything already
    // printed stops resolving. This should get the same confirm treatment links
    // have before it ships.
    if (useMockData) {
      setCodes((prev) => prev.filter((c) => c.id !== code.id))
      toast(`${code.label} deleted (mock, not saved)`)
      return
    }

    try {
      const res = await fetch(`/api/qrcodes/${code.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || "Couldn't delete the QR code")
        return
      }
      setCodes((prev) => prev.filter((c) => c.id !== code.id))
      toast(`${code.label} deleted`)
    } catch (err) {
      console.error('[QrCodesPage]', err)
      toast.error("Couldn't delete the QR code")
    }
  }

  async function handleSaveEdit() {
    if (!editing || !draft || savingEdit) return
    setSavingEdit(true)

    if (useMockData) {
      // Nothing to write to — mock codes aren't database rows. Applied locally
      // so the change is visible, and honest about not persisting.
      setCodes((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...draft } : c))
      )
      setEditing(null)
      setSavingEdit(false)
      toast(`${editing.label} updated (mock, not saved)`)
      return
    }

    try {
      const res = await fetch(`/api/qrcodes/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || "Couldn't update the QR code")
        return
      }
      // Merged rather than re-fetched: the response is the updated row, and a
      // refetch would rebuild every card to change one.
      setCodes((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...data.qrCode } : c))
      )
      setEditing(null)
      toast(`${data.qrCode.label} updated`)
    } catch (err) {
      console.error('[QrCodesPage]', err)
      toast.error("Couldn't update the QR code")
    } finally {
      setSavingEdit(false)
    }
  }

  const loaded = Array.isArray(codes)
  const totalScans = loaded ? codes.reduce((sum, c) => sum + c.scans, 0) : 0
  // Only codes whose link still resolves. A code pointing at a deleted link
  // still gets scanned but can't send anyone anywhere, so counting it as active
  // would overstate what's actually working.
  const activeCount = loaded ? codes.filter((c) => !c.link?.deleted).length : 0
  const metrics = [
    { label: 'Total scans', value: loaded ? totalScans : undefined },
    { label: 'Active codes', value: loaded ? activeCount : undefined },
  ]

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
        {/* The same component the links page uses, so the two pages read as one
            app rather than two. Metrics differ because scans aren't clicks —
            and there's no "unique scanners" here, deliberately: Click records no
            visitor identifier, so it can't be computed, and a number that can't
            be derived shouldn't be displayed. */}
        <StatsCards
          title='All QR codes'
          metrics={metrics}
          selectedRange={range}
          onRangeChange={setRange}
        />
      </div>

      <div
        className='dashboard-section dashboard-section-4 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          // 32px, matching the links page's stats-to-list gap. Without it the
          // list sat flush against the stats.
          paddingTop: '32px',
          paddingBottom: '64px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '720px' }}>
          {/* The switcher sits with the list, not the stats — it changes how
              the list looks, and putting it up in the header would separate a
              control from the thing it controls. */}
          {loaded && codes.length > 0 ? (
            <div
              style={{
                display: 'flex',
                // Left, aligned with the table's first column rather than
                // floating at the far end away from everything it affects.
                justifyContent: 'flex-start',
                paddingBottom: '14px',
              }}
            >
              {/* SegmentedTabs with its track on, so this reads as a standard
                  segmented control rather than bare tabs. The container is a
                  prop rather than a wrapper here, so the pill inverts to sit
                  ON the track — a wrapper would have left a grey pill on a grey
                  background. */}
              <SegmentedTabs
                items={[
                  {
                    id: 'table',
                    label: (
                      <span
                        aria-label='Table'
                        title='Table'
                        style={{ display: 'flex' }}
                      >
                        <TableIcon />
                      </span>
                    ),
                  },
                  {
                    id: 'cards',
                    label: (
                      <span
                        aria-label='Cards'
                        title='Cards'
                        style={{ display: 'flex' }}
                      >
                        <CardsIcon />
                      </span>
                    ),
                  },
                  {
                    id: 'gallery',
                    label: (
                      <span
                        aria-label='Gallery'
                        title='Gallery'
                        style={{ display: 'flex' }}
                      >
                        <GalleryIcon />
                      </span>
                    ),
                  },
                ]}
                activeId={view}
                onChange={changeView}
                // 8px, not 4: with a track around them the segments need room
                // to not look cramped against its edge.
                padX='8px'
                container
              />
            </div>
          ) : null}

          {!loaded ? (
            <div className='qr-grid-cards'>
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : codes.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '64px 20px',
              }}
            >
              <p
                className='para-sm'
                style={{ color: 'var(--text-strong)', margin: 0 }}
              >
                No QR codes yet
              </p>
              <p
                className='para-xs'
                style={{
                  color: 'var(--text-soft)',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Open any link and choose Generate QR code to make one.
              </p>
            </div>
          ) : view === 'table' ? (
            <QrTable
              codes={codes}
              register={register}
              onOpen={openViewer}
              onEdit={startEditing}
              onDelete={handleDelete}
            />
          ) : view === 'gallery' ? (
            <QrGallery codes={codes} onOpen={openViewer} register={register} />
          ) : (
            <QrCards codes={codes} onOpen={openViewer} register={register} />
          )}
        </div>
      </div>

      {/* The same lightbox the designer uses, so a code looks and behaves the
          same wherever it's opened from. */}
      <QrLightbox
        open={viewerOpen}
        onClose={closeViewer}
        shortUrl={viewing?.scanUrl}
        value={viewing ? `https://${viewing.scanUrl}` : undefined}
        color={viewing?.color}
        markerColor={viewing?.markerColor}
        pattern={viewing?.pattern}
        branding={viewing?.branding}
        onEdit={viewing ? () => startEditing(viewing) : undefined}
      />

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        maxWidth='480px'
        labelledBy='qr-edit-title'
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p
              id='qr-edit-title'
              className='label-md'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              Edit QR code
            </p>
            <p
              className='para-sm'
              style={{ color: 'var(--text-sub)', margin: 0 }}
            >
              {editing?.label}
            </p>
          </div>

          {draft ? (
            <QrDesigner
              color={draft.color}
              markerColor={draft.markerColor}
              pattern={draft.pattern}
              branding={draft.branding}
              shortUrl={editing?.scanUrl}
              onChange={setDraft}
            />
          ) : null}

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button
              type='button'
              onClick={() => setEditing(null)}
              className='create-secondary'
              style={{
                flex: '1 0 0',
                padding: '10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                letterSpacing: '0.28px',
                color: 'var(--bg-weak)',
              }}
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className='create-submit'
              style={{
                flex: '1 0 0',
                padding: '10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--text-strong)',
                border: 'none',
                cursor: savingEdit ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                letterSpacing: '0.28px',
                color: 'var(--bg-default)',
              }}
            >
              {savingEdit ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
