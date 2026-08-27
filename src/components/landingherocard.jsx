'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { QrCode } from '@/components/qrdesigner'
import { QR_COLORS, QR_PATTERNS } from '@/lib/qrdesign'
import { SHORT_DOMAIN } from '@/lib/shortlink'
import Inputfield from '@/components/input'
import Alert from '@/components/alert'
import SegmentedTabs from '@/components/segmentedtabs'

// ─── Hero card ───
// The real thing, not a picture of it. Paste a link, name it if you want, and
// get a working short URL — or a QR code you can style and download.
//
// No account needed. That's the point: the fastest way to show what a product
// does is to let someone do it.
const IMAGE = '/assets/websiteimage.png'

// ─── Mock mode ───
// The public endpoint needs PUBLIC_ORG_ID and a Domain row before it can
// create anything, so until that's set up this generates the link in the
// browser instead.
//
// The link LOOKS real and the QR code is genuinely encoded from it — but it
// resolves to nothing, so the card says so rather than handing someone a URL
// that 404s when they share it. Flip this to false once the endpoint is live.
const USE_MOCK = true

// Six characters, not adjective-noun. "swift-otter" makes a 21-character URL
// where this makes 16, and the whole point of a short link is the length.
//
// The alphabet drops 0/O and 1/l/I — a short code gets read aloud and typed by
// hand, and those are the pairs that get confused when it is.
const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function mockSlug(length = 6) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)]
  }
  return out
}

// The same shape the API returns, so switching to the real one is one constant
// and nothing downstream changes.
function mockLink(destination, requested) {
  const shortCode = requested || mockSlug()
  return {
    shortCode,
    shortUrl: `${SHORT_DOMAIN}/${shortCode}`,
    destination,
    mock: true,
  }
}

function LinkIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
      style={{ flexShrink: 0 }}
    >
      <path
        d='M8.5 11.5a3.2 3.2 0 0 0 4.8.35l2-2a3.2 3.2 0 0 0-4.5-4.5l-1.1 1.1M11.5 8.5a3.2 3.2 0 0 0-4.8-.35l-2 2a3.2 3.2 0 0 0 4.5 4.5l1.1-1.1'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Both states are always in the DOM, stacked, and cross-fade between them.
// Swapping one for the other leaves nothing to animate — you can't transition
// an element that was just unmounted.
function CopyIcon({ done }) {
  return (
    <span
      className='copy-glyph'
      data-done={done ? 'true' : 'false'}
      aria-hidden='true'
      style={{
        position: 'relative',
        width: '14px',
        height: '14px',
        flexShrink: 0,
      }}
    >
      <svg
        className='copy-glyph-copy'
        width='14'
        height='14'
        viewBox='0 0 16 16'
        fill='none'
      >
        <rect
          x='5.5'
          y='5.5'
          width='7.5'
          height='7.5'
          rx='2'
          stroke='currentColor'
          strokeWidth='1.3'
        />
        <path
          d='M10.5 5.5v-.8a2 2 0 0 0-2-2H4.7a2 2 0 0 0-2 2v3.8a2 2 0 0 0 2 2h.8'
          stroke='currentColor'
          strokeWidth='1.3'
          strokeLinecap='round'
        />
      </svg>
      <svg
        className='copy-glyph-check'
        width='14'
        height='14'
        viewBox='0 0 16 16'
        fill='none'
      >
        {/* dasharray 13 is this path's real length — 3.82 + 8.91 across its two
            segments. The app's check-reveal uses 19 because its icon is 20px;
            reusing that number here would leave the draw unfinished. */}
        <path
          d='M3.5 8.5 6.2 11.2 12.5 4.9'
          stroke='currentColor'
          strokeWidth='1.7'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  )
}

function DownloadIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M8 2.6v7.2M5.2 7.4 8 10.2l2.8-2.8M3 12.4h10'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M12 8H4M7.2 4.4 3.6 8l3.6 3.6'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// Shared by the anchor and its mock counterpart, so the two are identical
// apart from being clickable.
const SHORT_URL_STYLE = {
  flex: '1 0 0',
  minWidth: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '20px',
  letterSpacing: '0.28px',
  color: 'var(--text-strong)',
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

// Red glyph, black message — the alert's own colours handle the text, so only
// the icon carries the tone.
function AlertIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='10'
        cy='10'
        r='7.4'
        stroke='var(--error-base)'
        strokeWidth='1.5'
      />
      <path
        d='M10 6.2v4.6'
        stroke='var(--error-base)'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <circle cx='10' cy='13.4' r='0.9' fill='var(--error-base)' />
    </svg>
  )
}

function QrGlyph() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='2.2'
        y='2.2'
        width='4.4'
        height='4.4'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <rect
        x='9.4'
        y='2.2'
        width='4.4'
        height='4.4'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <rect
        x='2.2'
        y='9.4'
        width='4.4'
        height='4.4'
        rx='1'
        stroke='currentColor'
        strokeWidth='1.3'
      />
      <path
        d='M9.4 9.4h1.8v1.8H9.4zM12.4 12.4h1.4v1.4h-1.4z'
        fill='currentColor'
      />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className='btn-spinner'
      width='13'
      height='13'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle
        cx='8'
        cy='8'
        r='6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeDasharray='28'
        strokeDashoffset='9'
        opacity='0.9'
      />
    </svg>
  )
}

// ─── Field ───
// Node 147:769 / 147:770: a 12px medium label, then a 14px input on a soft
// bordered plate.
function Field({ label, hint, children }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: '1 0 0',
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          paddingRight: '4px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {hint ? (
          <span
            style={{
              flex: '1 0 0',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              color: 'var(--bg-muted)',
            }}
          >
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  )
}

export default function HeroCard() {
  const [mode, setMode] = useState('link')
  const [step, setStep] = useState('form') // form | done | design
  const [destination, setDestination] = useState('')
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [errorField, setErrorField] = useState(null)
  const [shaking, setShaking] = useState(false)
  const [copied, setCopied] = useState(false)

  // Design state, only used on the QR path.
  const [color, setColor] = useState('#000000')
  const [pattern, setPattern] = useState('square')

  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Same timings the app uses everywhere: the shake runs 320ms, the red border
  // and the message clear at 2s. An error that stays until you fix it turns
  // into part of the furniture; one that leaves says "try again" without
  // being asked to.
  function flag(message, field) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setError(message)
    setErrorField(field || 'destination')
    setShaking(true)
    timers.current.push(setTimeout(() => setShaking(false), 320))
    timers.current.push(
      setTimeout(() => {
        setError(null)
        setErrorField(null)
      }, 2000)
    )
  }

  function clearFlag() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setError(null)
    setErrorField(null)
    setShaking(false)
  }

  async function handleCreate() {
    if (busy) return
    const value = destination.trim()
    if (!value) {
      flag('Paste a link first', 'destination')
      return
    }

    setBusy(true)
    clearFlag()

    if (USE_MOCK) {
      // A beat before the result. Instant would read as nothing having
      // happened — the pause is what makes the button feel like it did
      // something, and it's what the real request will cost anyway.
      timers.current.push(
        setTimeout(() => {
          setResult(mockLink(value, slug.trim()))
          setStep(mode === 'qr' ? 'design' : 'done')
          setBusy(false)
        }, 420)
      )
      return
    }

    try {
      const res = await fetch('/api/public/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: value, slug: slug.trim() }),
      })
      const d = await res.json().catch(() => null)

      if (!res.ok) {
        flag(d?.error || `Could not create the link (${res.status})`, d?.field)
        return
      }
      setResult(d.link)
      // A QR goes straight to the designer; a plain link is already finished.
      setStep(mode === 'qr' ? 'design' : 'done')
    } catch (err) {
      console.error('[HeroCard]', err)
      flag('Could not reach the server. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard?.writeText(`https://${result.shortUrl}`)
    setCopied(true)
    timers.current.push(setTimeout(() => setCopied(false), 1600))
  }

  // Serialises the rendered SVG rather than re-drawing it, so the download is
  // exactly what's on screen — including the colour and pattern just chosen.
  function handleDownload() {
    const svg = document.querySelector('[data-hero-qr] svg')
    if (!svg) return
    const source = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result?.shortCode || 'luotain'}-qr.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setResult(null)
    setDestination('')
    setSlug('')
    setError(null)
    setErrorField(null)
    setCopied(false)
    setStep('form')
  }

  const shortUrl = result ? result.shortUrl : null

  return (
    <div
      className='landing-herocard'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '503px',
        maxWidth: '100%',
      }}
    >
      <div
        className='landing-herowell'
        style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
        }}
      >
        <img
          src={IMAGE}
          alt=''
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            // No gap. The toggle and the card space themselves with their own
            // margins, and the alert below sets its own — a gap here added to
            // that margin, which is why 12px rendered as 26.
            gap: 0,
            alignItems: 'stretch',
            width: '100%',
            maxWidth: '380px',
          }}
        >
          {/* The app's own SegmentedTabs — the same control the create page
              uses, with its sliding pill and measured transitions. I'd built a
              pair of pills by hand, which looked close and behaved differently.

              Hidden once there's a result: switching then would throw away
              what was just made.

              The wrapper below is a plate: SegmentedTabs draws its own sliding
              pill but no track — fine on the create page, which is white, but
              here it sits over a photograph and would otherwise float on the
              image with nothing for the pill to slide against. */}
          {step === 'form' ? (
            <div
              style={{
                alignSelf: 'center',
                marginBottom: '14px',
                padding: '3px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-default)',
                boxShadow: '0 2px 10px rgba(54, 54, 54, 0.08)',
              }}
            >
              <SegmentedTabs
                items={[
                  { id: 'link', label: 'Short link' },
                  { id: 'qr', label: 'QR code' },
                ]}
                activeId={mode}
                onChange={setMode}
                padX='16px'
              />
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '18px',
              borderRadius: '18px',
              background: 'var(--bg-default)',
              boxShadow: '0 6px 24px rgba(54, 54, 54, 0.10)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {step === 'form' ? (
              <>
                {/* The app's own Inputfield, not a hand-built plate. It brings
                    the focus morph, the shake, and the red border at rest —
                    the same behaviour every field in the product has, which
                    is the point of the landing page being the product. */}
                <Field label='Destination'>
                  <Inputfield
                    lefticon={<LinkIcon />}
                    placeholder='https://example.com/your-page'
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value)
                      clearFlag()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                    }}
                    error={errorField === 'destination'}
                    shaking={shaking && errorField === 'destination'}
                  />
                </Field>

                {/* Node 147:770. Domain is fixed on the public form — an
                    anonymous link can only live on the platform domain — so
                    it's shown rather than offered, which is honest about what
                    the choice actually is. */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: '150px', flexShrink: 0 }}>
                    <Field label='Domain'>
                      {/* readOnly, not disabled — the value stays selectable
                          and readable to a screen reader, which a disabled
                          input isn't. */}
                      <Inputfield
                        value={SHORT_DOMAIN}
                        onChange={() => {}}
                        readOnly
                      />
                    </Field>
                  </div>

                  <Field label='Slug' hint='(Optional)'>
                    <Inputfield
                      placeholder='swift-otter'
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value)
                        clearFlag()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate()
                      }}
                      error={errorField === 'slug'}
                      shaking={shaking && errorField === 'slug'}
                    />
                  </Field>
                </div>

                <button
                  type='button'
                  onClick={handleCreate}
                  disabled={busy}
                  className='landing-pill'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 20px',
                    borderRadius: '48px',
                    border: 'none',
                    cursor: busy ? 'default' : 'pointer',
                    alignSelf: 'flex-start',
                    background: 'var(--text-strong)',
                    color: 'var(--bg-default)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    lineHeight: '18px',
                    letterSpacing: '0.26px',
                  }}
                >
                  {busy ? <Spinner /> : null}
                  {busy
                    ? 'Creating'
                    : mode === 'qr'
                      ? 'Design code'
                      : 'Create link'}
                </button>
              </>
            ) : null}

            {/* ─── The result ─── */}
            {step !== 'form' ? (
              <>
                {step === 'design' ? (
                  <div
                    data-hero-qr
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      paddingBottom: '2px',
                    }}
                  >
                    {/* The app's own renderer, so what's downloaded here is
                        what the product makes. */}
                    <QrCode
                      value={`https://${shortUrl}`}
                      card={150}
                      margin={12}
                      color={color}
                      markerColor={color}
                      pattern={pattern}
                      // No branding on the public version — the logo cut-out
                      // needs an upload, and an upload needs somewhere to put
                      // a file and someone to own it.
                      branding={false}
                    />
                  </div>
                ) : null}

                {step === 'design' ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                      }}
                    >
                      {QR_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type='button'
                          onClick={() => setColor(c.hex)}
                          aria-label={c.id}
                          className='hero-swatch'
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            cursor: 'pointer',
                            background: c.hex,
                            // The ring marks the choice without moving
                            // anything — an outline would shift the row.
                            boxShadow:
                              color === c.hex
                                ? '0 0 0 2px var(--bg-default), 0 0 0 3.5px var(--text-strong)'
                                : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                      }}
                    >
                      {QR_PATTERNS.map((pt) => (
                        <button
                          key={pt.id}
                          type='button'
                          onClick={() => setPattern(pt.id)}
                          className='hero-pattern'
                          style={{
                            padding: '6px 12px',
                            borderRadius: '48px',
                            border: 'none',
                            cursor: 'pointer',
                            background:
                              pattern === pt.id
                                ? 'var(--bg-weak)'
                                : 'var(--bg-surface)',
                            color:
                              pattern === pt.id
                                ? 'var(--text-inverse)'
                                : 'var(--text-sub)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '12px',
                            lineHeight: '16px',
                            letterSpacing: '0.24px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      lineHeight: 1,
                      letterSpacing: '0.22px',
                      color: 'var(--text-soft)',
                    }}
                  >
                    Your short link
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '8px 8px 8px 14px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-layer)',
                    }}
                  >
                    {/* An anchor only when it goes somewhere. A mock link is
                        rendered as plain text — a clickable URL that 404s is
                        worse than one you can't click. */}
                    {result?.mock ? (
                      <span style={SHORT_URL_STYLE}>{shortUrl}</span>
                    ) : (
                      <a
                        href={`https://${shortUrl}`}
                        target='_blank'
                        rel='noreferrer'
                        style={SHORT_URL_STYLE}
                      >
                        {shortUrl}
                      </a>
                    )}
                    <button
                      type='button'
                      onClick={handleCopy}
                      className='landing-pill'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '48px',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: copied
                          ? 'var(--success-base)'
                          : 'var(--text-strong)',
                        color: 'var(--bg-default)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0.24px',
                        // Slower out than in: going green should register,
                        // coming back shouldn't pull the eye a second time.
                        transition: copied
                          ? 'background 220ms var(--ease-out)'
                          : 'background 420ms var(--ease-out)',
                      }}
                    >
                      <CopyIcon done={copied} />
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* New link left, the next step right — the same reading
                    order as everywhere else: the way back is where you came
                    from, the way forward is where you're going. */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%',
                  }}
                >
                  {/* The app's established secondary: bg-surface plate,
                      radius-full, text-sub. It was a bare text link, which is
                      a third button style the product doesn't have. */}
                  <button
                    type='button'
                    onClick={reset}
                    className='create-secondary'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      background: 'var(--bg-surface)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      lineHeight: '16px',
                      letterSpacing: '0.24px',
                      color: 'var(--text-sub)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <BackIcon />
                    New link
                  </button>

                  {step === 'done' ? (
                    // The link already exists, so this only opens the
                    // designer — nothing is created twice.
                    <button
                      type='button'
                      onClick={() => setStep('design')}
                      className='create-secondary'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'var(--bg-surface)',
                        color: 'var(--text-sub)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0.24px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <QrGlyph />
                      Generate QR code
                    </button>
                  ) : (
                    <button
                      type='button'
                      onClick={handleDownload}
                      className='create-secondary'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        background: 'var(--bg-surface)',
                        color: 'var(--text-sub)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0.24px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <DownloadIcon />
                      Download SVG
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Below the card, not inside it. Inside, its collapsed height still
              took the column's 14px gap — a strip of dead space under the
              button whether or not there was an error.

              The app's own Alert, card variant: white, soft stroke, red glyph,
              black text. */}
          <div className='hero-alert' data-shown={error ? 'true' : 'false'}>
            <Alert icon={<AlertIcon />} message={error || ''} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: 1.45,
            letterSpacing: '0.24px',
            color: 'var(--text-sub)',
            textAlign: 'center',
          }}
        >
          {result?.mock ? (
            <>
              {/* Said plainly. A preview that looks identical to the real
                  thing, without saying so, is how someone ends up printing a
                  code that goes nowhere. */}
              This is a preview, so the link won&rsquo;t open yet.{' '}
              <Link href='/get-started' style={{ color: 'var(--text-strong)' }}>
                Create an account
              </Link>{' '}
              for links that actually resolve.
            </>
          ) : result ? (
            <>
              Want the analytics behind it?{' '}
              <Link href='/get-started' style={{ color: 'var(--text-strong)' }}>
                Create an account
              </Link>{' '}
              and this link comes with you.
            </>
          ) : (
            'You get more control over your link creation when you create an account'
          )}
        </p>
      </div>
    </div>
  )
}
