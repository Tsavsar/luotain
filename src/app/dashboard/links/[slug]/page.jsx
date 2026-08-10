'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMockDataState } from '@/components/mockdatacontext'
import { useParams, useRouter } from 'next/navigation'
import BackButton from '@/components/backbutton'
import StatsCards from '@/components/statscards'
import ChartContainer from '@/components/chartcontainer'
import { Card } from '@/components/cardcontainer'
import FilterPill from '@/components/filterpill'
import CountryFlag from '@/components/countryflag'
import DeleteConfirmModal from '@/components/deleteconfirmmodal'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import { toast } from '@/components/toast'
import {
  formatRowDate,
  hostnameOf,
  slugOf,
  DestinationIcon,
  CopyIcon,
  MoreIcon,
} from '@/components/linktablehelpers'
import {
  getMockAnalytics,
  getMockLinksTable,
  getMockTrash,
} from '@/lib/mockAnalytics'
import { shortUrlFor } from '@/lib/shortlink'
import LogoMark from '@/components/logomark'
import Alert, { AlertAction, AlertInfoIcon } from '@/components/alert'
import Modal from '@/components/modal'
import CopyButton from '@/components/copybutton'
import QrDesigner, { QrLightbox } from '@/components/qrdesigner'
import { RECOVERY_WINDOW_DAYS, daysSinceDeleted } from '@/lib/linkrecovery'

function EyeIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M1.8 9s2.7-4.5 7.2-4.5S16.2 9 16.2 9s-2.7 4.5-7.2 4.5S1.8 9 1.8 9Z'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='9' cy='9' r='1.9' stroke='currentColor' strokeWidth='1.4' />
    </svg>
  )
}

// ─── One labelled field in the details block ───
// Node 73:6014 / 73:6017 / 73:6006 are all the same shape: a soft
// 12px label with a 14px value under it. Local to this file rather
// than a shared component — nothing else in the app uses this pattern
// yet, and one is not enough to generalise from.
function DetailField({ label, width, children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        justifyContent: 'center',
        width: width || '100%',
        minWidth: 0,
      }}
    >
      <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
        {label}
      </p>
      {children}
    </div>
  )
}

// The 260x160 visual slot beside the link's details (node 79:6035).
//
// Takes an optional imageUrl and falls back to a muted logo mark. That
// shape is deliberate: whatever eventually fills this — an Open Graph
// image scraped from the destination, or a generated QR — will fail
// often enough that a fallback isn't optional. OG tags are missing on
// plenty of URLs, some hosts refuse server-side fetches, some time
// out. So the logo isn't an alternative to a real image, it's what
// shows when there isn't one, and adding OG support later becomes a
// data change rather than a UI change.
function LinkPreview({ imageUrl, alt }) {
  const [failed, setFailed] = useState(false)
  const showImage = imageUrl && !failed

  return (
    <div
      style={{
        width: '260px',
        height: '160px',
        flexShrink: 0,
        borderRadius: '14px',
        background: 'var(--bg-light)',
        border: '1px solid var(--stroke-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Clips the image to the rounded corners, and matters for the
        // cover-fit below.
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt || ''}
          style={{
            width: '100%',
            height: '100%',
            // OG images are usually 1200x630 (1.91:1) against this
            // box's 1.625:1 — close, but not equal, so cover crops
            // rather than distorts. Letterboxing instead would leave
            // grey bars on nearly every image.
            objectFit: 'cover',
            display: 'block',
          }}
          // A dead image URL should fall back to the mark, not leave a
          // broken-image glyph sitting in the layout.
          onError={() => setFailed(true)}
        />
      ) : (
        <LogoMark size={44} muted />
      )}
    </div>
  )
}

export default function LinkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = decodeURIComponent(
    Array.isArray(params?.slug) ? params.slug[0] : params?.slug || ''
  )

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
  const [pendingDelete, setPendingDelete] = useState({
    link: null,
    origin: null,
  })
  // Drives the alert's exit collapse. Separate from the link's own
  // deletedAt so the alert can animate out over a couple of hundred
  // milliseconds before it unmounts, instead of vanishing the instant
  // recovery succeeds and dropping everything below it upward.
  // Card filters (source / country / device). The link itself is NOT a
  // filter here — this page is already scoped to one link, so a link
  // filter would be redundant, and the compare-links picker stays off
  // for the same reason.
  const [activeFilters, setActiveFilters] = useState([])
  const [collapsingAlert, setCollapsingAlert] = useState(false)
  const [recovering, setRecovering] = useState(false)
  // QR state. `hasQr` starts from the link's own record, so the field
  // shows the right thing on load rather than always starting at
  // "Generate".
  const [designingQr, setDesigningQr] = useState(false)
  const [viewingQr, setViewingQr] = useState(false)
  const [savingQr, setSavingQr] = useState(false)
  const [qr, setQr] = useState({
    color: '#000000',
    markerColor: '#000000',
    pattern: 'square',
    branding: true,
  })

  // Which link this page is about. Matched on slug rather than id for
  // the reason spelled out in slugOf(): mock ids contain a slash and
  // can't survive a URL path.
  const [link, setLink] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    // Wait until the saved mock preference is known — otherwise a
    // reload with mock on hits the network once for nothing.
    if (!mockReady) return
    let cancelled = false

    if (useMockData) {
      // Trash is checked FIRST, deliberately. If a slug ever turns up in
      // both lists, deleted has to win: rendering a deleted link as
      // live is the more harmful of the two mistakes, since it offers
      // actions that no longer apply. The mock data no longer overlaps
      // (getMockTrash and getMockLinksTable split one pool), but the
      // ordering shouldn't be what's holding that together.
      const found =
        getMockTrash(deletedUrls).find((r) => slugOf(r.shortUrl) === slug) ||
        getMockLinksTable(selectedRange, [], deletedUrls).find(
          (r) => slugOf(r.shortUrl) === slug
        ) ||
        null
      setLink(found)
      setLoadError(false)
      return
    }

    // Real path — fetches the actual link from the database. The
    // analytics below stay empty either way for now (there's no
    // per-link click aggregation endpoint yet), so the stats, chart
    // and cards render their own empty states, which is exactly what
    // the Figma frame shows.
    setLoadError(false)
    fetch(`/api/links/by-slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`link fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setLink(data.link ?? null)
      })
      .catch((err) => {
        // Logged rather than swallowed — a silent catch here is what
        // made the trash count's 500 look like a UI bug for several
        // rounds earlier.
        console.error('[LinkDetailPage]', err)
        if (!cancelled) {
          setLink(null)
          setLoadError(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [mockReady, useMockData, selectedRange, slug, deletedUrls])

  // The whole page is the analytics dashboard scoped to ONE link, so
  // it reuses the same generator with a link filter rather than
  // needing its own data shape. With mock off, everything below stays
  // null and each component renders its own empty state — which is
  // exactly what the Figma frame shows.
  const analytics = useMemo(() => {
    if (!useMockData || !link) return null
    // The link filter scopes everything to this one link; the card
    // filters layer on top of it. Both go through the same mechanism,
    // which is why the whole page is just the analytics dashboard
    // narrowed down.
    // The link filter naming this link is also what keeps its history
    // visible here after deletion — visibleEvents() in mockAnalytics
    // drops trashed links from aggregates but makes an exception when
    // one is asked for directly, which is exactly this case.
    return getMockAnalytics(
      selectedRange,
      [{ type: 'link', label: link.shortUrl }, ...activeFilters],
      deletedUrls
    )
  }, [useMockData, link, selectedRange, activeFilters, deletedUrls])

  const stats = analytics?.stats
  const cardData = analytics?.cardData

  // Same four as the analytics dashboard. Figma's four cards are all
  // placeholder copy ("Links created", value 6, hidden trend tag),
  // and "Links created" is meaningless on a single link's page, so
  // these are the four that actually mean something here. Worth a
  // look in case you had different ones in mind.
  const metrics = [
    {
      label: 'Total clicks',
      value: stats?.totalClicks,
      trend: stats?.clicksTrend,
    },
    {
      label: 'Total scans',
      value: stats?.totalScans,
      trend: stats?.scansTrend,
    },
    {
      label: 'Unique visitors',
      value: stats?.uniqueVisitors,
      trend: stats?.visitorsTrend,
    },
    {
      label: 'Top country',
      value: stats?.topCountry?.name,
      icon: stats?.topCountry ? (
        <CountryFlag country={stats.topCountry.name} />
      ) : null,
      trend: stats?.topCountry
        ? { label: `${stats.topCountry.percentage}%`, color: 'var(--text-sub)' }
        : null,
    },
  ]

  const shortUrl = link?.shortUrl || shortUrlFor(slug)

  function toggleFilter(filter) {
    setActiveFilters((prev) => {
      const exists = prev.some(
        (f) => f.type === filter.type && f.label === filter.label
      )
      if (exists) {
        return prev.filter(
          (f) => !(f.type === filter.type && f.label === filter.label)
        )
      }
      return [...prev, filter]
    })
  }
  function removeFilter(filter) {
    setActiveFilters((prev) =>
      prev.filter((f) => !(f.type === filter.type && f.label === filter.label))
    )
  }
  function clearAllFilters() {
    setActiveFilters([])
  }

  // A deleted link still renders its whole page — just archived. The
  // route serves it deliberately (see the comment there); anything
  // past the recovery window 404s instead and lands in loadError.
  const [qrCreatedLocally, setQrCreatedLocally] = useState(false)
  const hasQr = Boolean(link?.hasQrCode) || qrCreatedLocally

  const isDeleted = Boolean(link?.deletedAt)
  const deletedDaysAgo = link?.deletedAt ? daysSinceDeleted(link.deletedAt) : 0
  const daysLeft = Math.max(0, RECOVERY_WINDOW_DAYS - deletedDaysAgo)

  function pluralDays(n) {
    return n === 1 ? '1 day' : `${n} days`
  }
  // "0 days ago" and "in 0 days" are both just wrong English, and both
  // are reachable: the first on the day a link is deleted, the second
  // on its final day in the trash.
  const deletedPhrase =
    deletedDaysAgo === 0 ? 'today' : `${pluralDays(deletedDaysAgo)} ago`
  const expiryPhrase = daysLeft === 0 ? 'today' : `in ${pluralDays(daysLeft)}`

  async function handleRecover() {
    if (!link || recovering) return
    setRecovering(true)

    if (useMockData) {
      // No network with mock data on — mock ids aren't database rows.
      // Clearing it from shared state is what actually brings the link
      // back everywhere else; the local deletedAt clear below is just
      // so this page un-greys in the same motion rather than waiting
      // for a re-fetch.
      setCollapsingAlert(true)
      setTimeout(() => {
        recoverMockLink(link.shortUrl)
        setLink((prev) => (prev ? { ...prev, deletedAt: null } : prev))
        setCollapsingAlert(false)
        setRecovering(false)
      }, 250)
      toast(`${link.shortUrl} recovered`)
      return
    }

    try {
      const res = await fetch(`/api/links/${link.id}/recover`, {
        method: 'POST',
      })
      if (!res.ok) {
        if (res.status === 410) {
          toast.error(`Past the ${RECOVERY_WINDOW_DAYS}-day recovery window`)
        } else {
          throw new Error(`recover failed: ${res.status}`)
        }
        setRecovering(false)
        return
      }
      // Collapse the alert first, then clear deletedAt — so the grey
      // lifting and the alert leaving happen as one motion rather than
      // the page snapping back to life in a single frame.
      setCollapsingAlert(true)
      setTimeout(() => {
        setLink((prev) => (prev ? { ...prev, deletedAt: null } : prev))
        setCollapsingAlert(false)
        setRecovering(false)
      }, 250)
      toast(`${link.shortUrl} recovered`)
    } catch (err) {
      console.error('[LinkDetailPage]', err)
      toast.error(`Couldn't recover ${link.shortUrl}`)
      setRecovering(false)
    }
  }

  async function handleCreateQr() {
    if (!link || savingQr) return
    setSavingQr(true)

    if (useMockData) {
      // Nothing to write to — mock links aren't database rows.
      setQrCreatedLocally(true)
      setDesigningQr(false)
      setSavingQr(false)
      toast(`QR code created for ${link.shortUrl} (mock, not saved)`)
      return
    }

    try {
      // Real now. The endpoint generates the QR's own slug — separate from
      // the link's, so a scan can be attributed to this placement — and stores
      // the design so it renders as the one that was created.
      const res = await fetch('/api/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id, ...qr }),
      })

      // The response body is read whether it succeeded or not. This previously
      // threw on `!res.ok` and showed a generic message, which discarded the
      // one thing worth having — the endpoint says exactly what went wrong
      // ("Link not found", "That link is in the trash", a Prisma error) and all
      // of that was being thrown away.
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        console.error('[LinkDetailPage] qr create failed', res.status, data)
        toast.error(
          data?.error || `Couldn't create the QR code (${res.status})`
        )
        return
      }

      setQrCreatedLocally(true)
      setDesigningQr(false)
      toast('QR code created')
    } catch (err) {
      console.error('[LinkDetailPage]', err)
      toast.error("Couldn't create the QR code")
    } finally {
      setSavingQr(false)
    }
  }

  async function handleDelete(target) {
    if (useMockData) {
      // This used to only fire a toast and navigate — the link stayed
      // in the list, never reached the trash, and the totals didn't
      // move, so deleting from this page did nothing at all. Recorded
      // in shared state now, same as the links page, which is what
      // makes it a real delete.
      deleteMockLink(target.shortUrl)
      toast(`${target.shortUrl} moved to trash`, {
        action: {
          label: 'Undo',
          onClick: () => recoverMockLink(target.shortUrl),
        },
      })
      router.push('/dashboard/links')
      return
    }

    const res = await fetch(`/api/links/${target.id}/delete`, {
      method: 'POST',
    })
    if (!res.ok) {
      // Thrown, not caught — DeleteConfirmModal's own handleConfirm
      // catches it, keeps the modal open and re-enables the buttons.
      throw new Error('Failed to delete link')
    }
    toast(`${target.shortUrl} moved to trash`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          // Same recover endpoint the trash page uses — an undo IS a
          // recover, just reached from the toast. The toast outlives
          // the navigation below because ToastStack lives in the
          // dashboard layout, not on this page.
          const recoverRes = await fetch(`/api/links/${target.id}/recover`, {
            method: 'POST',
          })
          if (recoverRes.ok) {
            router.push(`/dashboard/links/${slugOf(target.shortUrl)}`)
          } else {
            toast.error(`Couldn't undo`)
          }
        },
      },
    })
    // Back to the list — staying on the detail page for a link that
    // no longer exists would just show an empty shell.
    router.push('/dashboard/links')
  }

  return (
    <>
      {/* ─── Back row + link menu (node 73:5577) ─── */}
      <div
        className='dashboard-section dashboard-section-3 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          // 0, not 36 — the layout's header section already carries 24px
          // of bottom padding, so 36 here stacked into a 60px gap above
          // Back. Same fix the create page needed.
          paddingTop: 0,
          paddingBottom: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BackButton />

          <Dropdown
            align='right'
            trigger={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                }}
              >
                <MoreIcon />
              </div>
            }
          >
            <DropdownMenu width='160px'>
              {/* On a deleted link, Edit and Delete are both
                  meaningless — you can't edit something that's gone,
                  and it's already deleted. Recover is the only real
                  action, matching the alert above. */}
              {isDeleted ? (
                <DropdownOption onClick={handleRecover}>Recover</DropdownOption>
              ) : (
                <>
                  <DropdownOption
                    onClick={() => {
                      // TODO: route to the link's edit view once it exists
                    }}
                  >
                    Edit
                  </DropdownOption>
                  <DropdownOption
                    danger
                    onClick={(e) => {
                      if (!link) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      setPendingDelete({
                        link,
                        origin: {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2,
                        },
                      })
                    }}
                  >
                    Delete
                  </DropdownOption>
                </>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* ─── QR + link details (node 73:5994) ─── */}
      <div
        className='dashboard-section dashboard-section-4 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '32px',
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
          {/* Alert sits OUTSIDE the archived wrapper below, in full
              colour and fully interactive — it holds the one action
              that still applies to a deleted link. */}
          {isDeleted ? (
            <div
              className={`alert-collapse${collapsingAlert ? ' is-collapsing' : ''}`}
            >
              <Alert
                variant='inline'
                icon={<AlertInfoIcon />}
                message={`This link was deleted ${deletedPhrase}. It will be permanently deleted ${expiryPhrase}.`}
                action={
                  <AlertAction onClick={handleRecover} disabled={recovering}>
                    {recovering ? 'Recovering...' : 'Recover'}
                  </AlertAction>
                }
              />
            </div>
          ) : null}

          <div
            className={`link-detail-meta${isDeleted ? ' is-archived' : ''}`}
            style={{
              width: '100%',
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            {loadError ? (
              // The slug in the URL is user-supplied, so a link that
              // doesn't resolve is an ordinary case, not an edge one.
              // Saying so beats rendering the full layout with a dash in
              // every field, which reads as "this link exists but has no
              // data" — a different and wrong message.
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  alignItems: 'center',
                  padding: '48px 0',
                }}
              >
                <p
                  className='para-sm'
                  style={{ color: 'var(--text-strong)', margin: 0 }}
                >
                  Link not found
                </p>
                <p
                  className='para-xs'
                  style={{ color: 'var(--text-soft)', margin: 0 }}
                >
                  It may have been deleted, or belong to another organization.
                </p>
              </div>
            ) : (
              <>
                <LinkPreview
                  imageUrl={link?.ogImageUrl}
                  alt={link?.title || ''}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <DetailField label='Short link'>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <p
                        className='para-sm'
                        style={{ color: 'var(--text-strong)', margin: 0 }}
                      >
                        {shortUrl}
                      </p>
                      <CopyButton
                        value={shortUrl}
                        icon={<CopyIcon />}
                        label='Copy link'
                        toastMessage='Link copied to clipboard'
                      />
                    </div>
                  </DetailField>

                  <DetailField label='Destination'>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        minWidth: 0,
                      }}
                    >
                      <DestinationIcon domain={hostnameOf(link?.destination)} />
                      <p
                        className='para-sm'
                        style={{
                          flex: 1,
                          minWidth: 0,
                          color: 'var(--text-strong)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {link?.destination || '-'}
                      </p>
                    </div>
                  </DetailField>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <DetailField label='Date created' width='150px'>
                      <p
                        className='para-sm'
                        style={{ color: 'var(--text-strong)', margin: 0 }}
                      >
                        {link?.createdAt ? formatRowDate(link.createdAt) : '-'}
                      </p>
                    </DetailField>

                    <DetailField label='QR Code' width='150px'>
                      {/* Two states. Before: "Generate QR code" with the dotted
                    underline (node 79:6150). After: "View QR code" with
                    an eye (node 87:1274) — plain, no underline, because
                    it's no longer offering to make something. */}
                      {hasQr ? (
                        <button
                          onClick={() => setViewingQr(true)}
                          className='para-sm qr-field-action'
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                            color: 'var(--text-strong)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          View QR code
                          <EyeIcon />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDesigningQr(true)}
                          className='para-sm'
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                            color: 'var(--text-strong)',
                            textAlign: 'left',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          Generate QR code
                        </button>
                      )}
                    </DetailField>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Analytics stats (node 435:913) ─── */}
      <div
        className='dashboard-section dashboard-section-5 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 0,
        }}
      >
        <div
          className={isDeleted ? 'is-archived' : undefined}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <StatsCards
            title='Analytics'
            metrics={metrics}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            filters={
              activeFilters.length > 0 ? (
                <FilterPill
                  filters={activeFilters}
                  onRemove={removeFilter}
                  onClearAll={clearAllFilters}
                />
              ) : null
            }
          />
        </div>
      </div>

      {/* ─── Chart (node 79:6504) ─── */}
      <div
        className='dashboard-section dashboard-section-6 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '32px',
          paddingBottom: '36px',
        }}
      >
        {/* chart-full-bleed wrapper, same as the analytics page —
            without it the chart stays boxed at the 720px content
            width instead of running edge to edge. */}
        <div
          className={`chart-full-bleed${isDeleted ? ' is-archived' : ''}`}
          style={{ width: '100%' }}
        >
          <ChartContainer data={analytics?.chartData} />
        </div>
      </div>

      {/* ─── Cards (node 73:5813) ───
          Sources full width, then Geography and Devices side by side.
          No Clicks card: this page IS one link, so a per-link clicks
          breakdown of it would just be the same number again. */}
      <div
        className='dashboard-section dashboard-section-7 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '64px',
        }}
      >
        <div
          className={isDeleted ? 'is-archived' : undefined}
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <Card
            title='Sources'
            columnOptions={['Visitors']}
            showDropdown={false}
            dataByColumn={cardData?.sources}
            iconType='favicon'
            filterType='source'
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
          />
          <div className='card-row'>
            <Card
              title='Geography'
              columnOptions={['Countries', 'Regions', 'Cities']}
              dataByColumn={cardData?.geography}
              iconType='flag'
              filterType='country'
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
            />
            <Card
              title='Devices'
              columnOptions={['Type', 'Browser']}
              dataByColumn={cardData?.devices}
              filterType='device'
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
            />
          </div>
        </div>
      </div>

      {/* Designing a QR from here skips the destination, domain and slug
          entirely — the link already has all three, so asking again would
          be asking for something we're holding. Straight to the styling. */}
      <Modal
        open={designingQr}
        onClose={() => setDesigningQr(false)}
        maxWidth='480px'
        labelledBy='qr-designer-title'
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p
              id='qr-designer-title'
              className='label-md'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              Design your QR code
            </p>
            <p
              className='para-sm'
              style={{ color: 'var(--text-sub)', margin: 0 }}
            >
              For {link?.shortUrl}
            </p>
          </div>

          <QrDesigner
            color={qr.color}
            markerColor={qr.markerColor}
            pattern={qr.pattern}
            branding={qr.branding}
            shortUrl={link?.shortUrl}
            onChange={setQr}
          />

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button
              type='button'
              onClick={() => setDesigningQr(false)}
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
              onClick={handleCreateQr}
              disabled={savingQr}
              className='create-submit'
              style={{
                flex: '1 0 0',
                padding: '10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--text-strong)',
                border: 'none',
                cursor: savingQr ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                letterSpacing: '0.28px',
                color: 'var(--bg-default)',
              }}
            >
              {savingQr ? 'Creating…' : 'Create code'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Viewing an existing code goes straight to the lightbox — no
          designer, since there's nothing to decide. */}
      <QrLightbox
        open={viewingQr}
        onClose={() => setViewingQr(false)}
        shortUrl={link?.shortUrl}
        color={qr.color}
        markerColor={qr.markerColor}
        pattern={qr.pattern}
        branding={qr.branding}
      />

      <DeleteConfirmModal
        open={pendingDelete.link !== null}
        onClose={() => setPendingDelete({ link: null, origin: null })}
        onConfirm={() => handleDelete(pendingDelete.link)}
        itemType='link'
        itemLabel={pendingDelete.link?.shortUrl}
        origin={pendingDelete.origin}
      />
    </>
  )
}
