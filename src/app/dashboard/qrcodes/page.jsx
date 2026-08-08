'use client'

import { useEffect, useState } from 'react'
import { QrCode, QrLightbox } from '@/components/qrdesigner'
import { useMockDataState } from '@/components/mockdatacontext'
import { getMockQrCodes } from '@/lib/mockAnalytics'

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

function LinkOffIcon() {
  return (
    <svg
      width='13'
      height='13'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5.6 8.4 8.4 5.6M4.9 6.3 3.9 7.3a2.1 2.1 0 0 0 3 3l1-1M9.1 7.7l1-1a2.1 2.1 0 0 0-3-3l-1 1'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
      <path
        d='M1.6 1.6l10.8 10.8'
        stroke='currentColor'
        strokeWidth='1.2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function StatBlock({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
        {label}
      </p>
      <p
        className='label-lg'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        {value}
      </p>
    </div>
  )
}

function QrCard({ code, onOpen }) {
  const deleted = code.link?.deleted

  return (
    <button
      type='button'
      onClick={() => onOpen(code)}
      className='qr-card'
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        width: '100%',
        background: 'none',
        border: 'none',
        borderRadius: '14px',
        padding: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        boxSizing: 'border-box',
      }}
    >
      {/* The real encoded code, at its stored design. Dimmed when the link is
          gone rather than hidden — the sticker still physically exists and
          people will still scan it, so the code has to stay recognisable. */}
      <div
        style={{
          flexShrink: 0,
          opacity: deleted ? 0.4 : 1,
          transition: 'opacity var(--duration-fast) ease',
        }}
      >
        <QrCode
          value={`https://${code.scanUrl}`}
          color={code.color}
          markerColor={code.markerColor}
          pattern={code.pattern}
          branding={code.branding}
          card={72}
          margin={4}
          radius={10}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          minWidth: 0,
          flex: '1 0 0',
        }}
      >
        {/* The label leads, not the URL. "Store window" is what you need to
            find; the slug is machine-readable and means nothing to a person. */}
        <p
          className='para-sm'
          style={{
            margin: 0,
            color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {code.label}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '5px',
            alignItems: 'center',
            minWidth: 0,
            color: deleted ? 'var(--text-disabled)' : 'var(--text-soft)',
          }}
        >
          {deleted ? <LinkOffIcon /> : null}
          <span
            className='para-xs'
            style={{
              color: 'inherit',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {deleted ? 'Link deleted' : code.link?.shortUrl}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
          <span
            className='label-sm'
            style={{
              color: deleted ? 'var(--text-sub)' : 'var(--text-strong)',
            }}
          >
            {code.scans.toLocaleString()}
          </span>
          <span className='para-xs' style={{ color: 'var(--text-soft)' }}>
            {code.scans === 1 ? 'scan' : 'scans'}
          </span>
        </div>
      </div>
    </button>
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
  const [viewing, setViewing] = useState(null)

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

  const loaded = Array.isArray(codes)
  const totalScans = loaded ? codes.reduce((sum, c) => sum + c.scans, 0) : 0
  // Only codes whose link still resolves. A code pointing at a deleted link
  // still gets scanned but can't send anyone anywhere, so counting it as active
  // would overstate what's actually working.
  const activeCount = loaded ? codes.filter((c) => !c.link?.deleted).length : 0

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
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            gap: '40px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <StatBlock
            label='Total scans'
            value={loaded ? totalScans.toLocaleString() : '—'}
          />
          <StatBlock label='Active codes' value={loaded ? activeCount : '—'} />
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
        <div style={{ width: '100%', maxWidth: '720px' }}>
          {!loaded ? (
            <div className='qr-grid'>
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
          ) : (
            <div className='qr-grid'>
              {codes.map((code) => (
                <QrCard key={code.id} code={code} onOpen={setViewing} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* The same lightbox the designer uses, so a code looks and behaves the
          same wherever it's opened from. */}
      <QrLightbox
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        shortUrl={viewing?.scanUrl}
        value={viewing ? `https://${viewing.scanUrl}` : undefined}
        color={viewing?.color}
        markerColor={viewing?.markerColor}
        pattern={viewing?.pattern}
        branding={viewing?.branding}
      />
    </>
  )
}
