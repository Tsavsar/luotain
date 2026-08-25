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

        {/* One row: field and action together.
            
            The previous version was a bordered card inside the well with a
            label above the field and the button below it — three stacked
            elements and two nested containers for what is one input and one
            button. */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            alignItems: 'center',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {result ? (
            <>
              {mode === 'qr' ? (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '18px',
                    background: 'var(--bg-default)',
                    boxShadow: '0 6px 24px rgba(54, 54, 54, 0.10)',
                    lineHeight: 0,
                  }}
                >
                  {/* The app's own renderer — what someone scans here is what
                      the product makes, not a lookalike. */}
                  <QrCode
                    value={`https://${result.shortUrl}`}
                    card={128}
                    margin={10}
                    color='var(--text-strong)'
                    markerColor='var(--text-strong)'
                    pattern='square'
                    branding={false}
                  />
                </div>
              ) : null}

              {/* The result takes the field's place rather than appearing
                  under it, so the eye stays where the action happened. */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '6px 6px 6px 18px',
                  borderRadius: '48px',
                  background: 'var(--bg-default)',
                  boxShadow: '0 4px 20px rgba(54, 54, 54, 0.10)',
                  width: '100%',
                  boxSizing: 'border-box',
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
                    fontSize: '15px',
                    fontWeight: 500,
                    lineHeight: '22px',
                    letterSpacing: '0.3px',
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
                  className='landing-pill'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '48px',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    background: copied
                      ? 'var(--success-base)'
                      : 'var(--text-strong)',
                    color: 'var(--bg-default)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    lineHeight: '18px',
                    letterSpacing: '0.26px',
                    transition: 'background 200ms var(--ease-out)',
                  }}
                >
                  <CopyIcon done={copied} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
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
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  lineHeight: '18px',
                  letterSpacing: '0.26px',
                  color: 'var(--text-sub)',
                }}
              >
                Shorten another
              </button>
            </>
          ) : (
            <>
              {/* Above the field, because it changes what the button says —
                  putting it after would mean reading the button, looking up,
                  then back. */}
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '3px',
                  borderRadius: '48px',
                  background: 'var(--bg-default)',
                  boxShadow: '0 2px 10px rgba(54, 54, 54, 0.08)',
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
                      padding: '8px 16px',
                      borderRadius: '48px',
                      border: 'none',
                      cursor: 'pointer',
                      background:
                        mode === id ? 'var(--bg-layer)' : 'transparent',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      lineHeight: 1,
                      letterSpacing: '0.26px',
                      color:
                        mode === id ? 'var(--text-strong)' : 'var(--text-sub)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Field and action on one line. No label: a single input with a
                  placeholder that shows the shape of what goes in needs no
                  second explanation above it. */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '6px 6px 6px 16px',
                  borderRadius: '48px',
                  background: 'var(--bg-default)',
                  border: `1px solid ${errored ? 'var(--error-base)' : 'transparent'}`,
                  boxShadow: '0 4px 20px rgba(54, 54, 54, 0.10)',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'border-color 160ms var(--ease-out)',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    color: 'var(--text-soft)',
                    flexShrink: 0,
                  }}
                >
                  <LinkIcon />
                </span>
                <input
                  id='hero-destination'
                  type='url'
                  inputMode='url'
                  autoComplete='off'
                  aria-label='Link to shorten'
                  placeholder='Paste a link'
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
                    // 16 exactly. iOS Safari zooms the page when an input's
                    // text is smaller, and a zoomed hero on first tap is a
                    // poor first impression.
                    fontSize: '16px',
                    lineHeight: '22px',
                    letterSpacing: '0.32px',
                    color: 'var(--text-strong)',
                  }}
                />
                <button
                  type='button'
                  onClick={handleCreate}
                  disabled={busy}
                  className='landing-pill'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '9px 18px',
                    borderRadius: '48px',
                    border: 'none',
                    cursor: busy ? 'default' : 'pointer',
                    flexShrink: 0,
                    background: 'var(--text-strong)',
                    color: 'var(--bg-default)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    lineHeight: '18px',
                    letterSpacing: '0.26px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {busy ? <Spinner /> : null}
                  {busy ? 'Creating' : mode === 'qr' ? 'Get code' : 'Shorten'}
                </button>
              </div>
            </>
          )}
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
