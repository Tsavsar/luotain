'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BackButton from '@/components/backbutton'
import StatsCards from '@/components/statscards'
import ChartContainer from '@/components/chartcontainer'
import { Card } from '@/components/cardcontainer'
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
import { getMockAnalytics, getMockLinksTable } from '@/lib/mockAnalytics'
import { shortUrlFor } from '@/lib/shortlink'
import LogoMark from '@/components/logomark'

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

  const [useMockData, setUseMockData] = useState(false)
  const [selectedRange, setSelectedRange] = useState('Last 7 days')
  const [pendingDelete, setPendingDelete] = useState({
    link: null,
    origin: null,
  })

  // Which link this page is about. Matched on slug rather than id for
  // the reason spelled out in slugOf(): mock ids contain a slash and
  // can't survive a URL path.
  const [link, setLink] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (useMockData) {
      const rows = getMockLinksTable(selectedRange, [])
      setLink(rows.find((r) => slugOf(r.shortUrl) === slug) || null)
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
  }, [useMockData, selectedRange, slug])

  // The whole page is the analytics dashboard scoped to ONE link, so
  // it reuses the same generator with a link filter rather than
  // needing its own data shape. With mock off, everything below stays
  // null and each component renders its own empty state — which is
  // exactly what the Figma frame shows.
  const analytics = useMemo(() => {
    if (!useMockData || !link) return null
    return getMockAnalytics(selectedRange, [
      { type: 'link', label: link.shortUrl },
    ])
  }, [useMockData, link, selectedRange])

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

  async function handleDelete(target) {
    if (useMockData) {
      // No Undo offered here on purpose, unlike the links page. A mock
      // delete on this page has nothing to reverse: it never wrote
      // anything, and the list it returns to re-seeds straight from
      // the generator, so the link is still there either way. An Undo
      // button that does nothing is worse than no button.
      toast(`${target.shortUrl} moved to trash`)
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
          paddingTop: '36px',
          paddingBottom: '32px',
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
          className='link-detail-meta'
          style={{
            width: '100%',
            maxWidth: '720px',
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
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(shortUrl)
                        toast('Link copied to clipboard')
                      }}
                      title='Copy'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <CopyIcon />
                    </button>
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
                    <button
                      onClick={() => {
                        // TODO: wire up QR generation — the QrCode model
                        // exists in the schema, but nothing writes to it yet.
                        toast('QR code generation is coming soon')
                      }}
                      className='para-sm'
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        color: 'var(--text-strong)',
                        textAlign: 'left',
                        // Dotted underline per Figma (node 79:6150) — reads
                        // as an action rather than a plain value.
                        textDecoration: 'underline',
                        textDecorationStyle: 'dotted',
                        textDecorationColor: 'var(--text-soft)',
                        textUnderlineOffset: '3px',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Generate QR code
                    </button>
                  </DetailField>
                </div>
              </div>
            </>
          )}
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
        <StatsCards
          title='Analytics'
          metrics={metrics}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
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
        <div className='chart-full-bleed' style={{ width: '100%' }}>
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
          />
          <div className='card-row'>
            <Card
              title='Geography'
              columnOptions={['Countries', 'Regions', 'Cities']}
              dataByColumn={cardData?.geography}
              iconType='flag'
              filterType='country'
            />
            <Card
              title='Devices'
              columnOptions={['Type', 'Browser']}
              dataByColumn={cardData?.devices}
              filterType='device'
            />
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        open={pendingDelete.link !== null}
        onClose={() => setPendingDelete({ link: null, origin: null })}
        onConfirm={() => handleDelete(pendingDelete.link)}
        itemType='link'
        itemLabel={pendingDelete.link?.shortUrl}
        origin={pendingDelete.origin}
      />

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
