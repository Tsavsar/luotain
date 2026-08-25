'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { QrCode } from '@/components/qrdesigner'
import { toast } from '@/components/toast'

// ─── Hero card ───
// A working creator, not a picture of one. Paste a link, get a short URL and a
// QR code for it, without an account.
//
// The design draws a miniature of the app's form at 4-8px type. That reads as
// decoration in Figma and as illegible on a screen, so this is the same layout
// at usable sizes — the point is that someone can actually use it.
const IMAGE = '/assets/websiteimage.png'

function LinkIcon() {
  return (
    <svg
      width='16'
      height='16'
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

function CopyIcon({ done }) {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      {done ? (
        <path
          d='M3.5 8.5 6.2 11.2 12.5 4.9'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      ) : (
        <>
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
        </>
      )}
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

export default function HeroCard() {
  const [mode, setMode] = useState('link')
  const [destination, setDestination] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [errored, setErrored] = useState(false)
  const [copied, setCopied] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  async function handleCreate() {
    if (busy) return
    const value = destination.trim()
    if (!value) {
      setErrored(true)
      timers.current.push(setTimeout(() => setErrored(false), 2000))
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/public/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: value }),
      })
      const d = await res.json().catch(() => null)

      if (!res.ok) {
        setErrored(true)
        timers.current.push(setTimeout(() => setErrored(false), 2000))
        toast.error(d?.error || 'Could not create the link')
        return
      }
      setResult(d.link)
    } catch (err) {
      console.error('[HeroCard]', err)
      toast.error('Could not create the link')
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

  function reset() {
    setResult(null)
    setDestination('')
    setCopied(false)
  }

  return (
    <div
      className='landing-herocard'
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px',
        background: 'var(--bg-surface)',
        width: '503px',
        maxWidth: '100%',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          minHeight: '343px',
          borderRadius: '8px',
          border: '2px solid var(--stroke-soft)',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <img
          src={IMAGE}
          alt=''
          style={{
            position: 'absolute',
            inset: '-2px',
            width: 'calc(100% + 4px)',
            height: 'calc(100% + 4px)',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            width: '300px',
            maxWidth: '100%',
          }}
        >
          {/* Short link / QR code. Both create the same link — the difference
              is what you're shown afterwards, which is exactly true of the
              product: every link has a code. */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              padding: '2px',
              borderRadius: '21px',
              background: 'var(--bg-default)',
              border: '1px solid var(--stroke-soft)',
            }}
          >
            {[
              ['link', 'Short link'],
              ['qr', 'QR code'],
            ].map(([id, label]) => (
              <button
                key={id}
                type='button'
                onClick={() => setMode(id)}
                className='landing-pill'
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === id ? 'var(--bg-layer)' : 'transparent',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  lineHeight: 1,
                  letterSpacing: '0.24px',
                  color: 'var(--text-strong)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '14px',
              borderRadius: '16px',
              background: 'var(--bg-default)',
              border: '1px solid var(--stroke-soft)',
              boxShadow: '0 4px 16px rgba(54, 54, 54, 0.06)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {result ? (
              <>
                {/* The code, only in QR mode. Rendered by the app's own
                    QrCode, so what someone scans here is what the product
                    produces — not a stand-in that looks similar. */}
                {mode === 'qr' ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '10px 0 2px',
                    }}
                  >
                    {/* `card` is the pixel size and `margin` the quiet zone
                        inside it — there's no `size` prop, and passing one
                        would have been silently ignored. 12 of margin at 132
                        is roughly the 4-module quiet zone a scanner wants. */}
                    <QrCode
                      value={`https://${result.shortUrl}`}
                      card={132}
                      margin={12}
                      color='var(--text-strong)'
                      markerColor='var(--text-strong)'
                      pattern='square'
                      branding={false}
                    />
                  </div>
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
                      padding: '10px 8px 10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-layer)',
                    }}
                  >
                    <a
                      href={`https://${result.shortUrl}`}
                      target='_blank'
                      rel='noreferrer'
                      style={{
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
                      }}
                    >
                      {result.shortUrl}
                    </a>
                    <button
                      type='button'
                      onClick={handleCopy}
                      aria-label='Copy short link'
                      className='landing-pill'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'var(--bg-default)',
                        color: copied
                          ? 'var(--success-base)'
                          : 'var(--text-sub)',
                        flexShrink: 0,
                      }}
                    >
                      <CopyIcon done={copied} />
                    </button>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={reset}
                  className='landing-pill'
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.24px',
                    color: 'var(--text-soft)',
                  }}
                >
                  Shorten another
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <label
                    htmlFor='hero-destination'
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      fontWeight: 500,
                      lineHeight: 1,
                      letterSpacing: '0.22px',
                      color: 'var(--text-strong)',
                    }}
                  >
                    Destination
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '10px 10px 10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-default)',
                      border: `1px solid ${errored ? 'var(--error-base)' : 'var(--stroke-soft)'}`,
                      boxShadow: '0 1px 2px rgba(54, 54, 54, 0.04)',
                      transition: 'border-color 160ms var(--ease-out)',
                    }}
                  >
                    <span
                      style={{ display: 'flex', color: 'var(--text-soft)' }}
                    >
                      <LinkIcon />
                    </span>
                    <input
                      id='hero-destination'
                      type='url'
                      inputMode='url'
                      autoComplete='off'
                      placeholder='https://example.com/your-page'
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value)
                        setErrored(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate()
                      }}
                      style={{
                        flex: '1 0 0',
                        minWidth: 0,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'var(--font-sans)',
                        // 16 on mobile: iOS Safari zooms the whole page when an
                        // input's text is under 16px, and a zoomed hero on the
                        // first tap is a bad first impression.
                        fontSize: '16px',
                        lineHeight: '20px',
                        letterSpacing: '0.28px',
                        color: 'var(--text-strong)',
                      }}
                    />
                  </div>
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
                    padding: '10px 18px',
                    borderRadius: '48px',
                    border: 'none',
                    cursor: busy ? 'default' : 'pointer',
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
                      ? 'Create QR code'
                      : 'Create link'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          borderRadius: '16px',
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
          {result ? (
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
