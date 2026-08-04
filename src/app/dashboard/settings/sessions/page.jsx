'use client'

import { useEffect, useState } from 'react'
import { browserMarkFor } from '@/components/browsermarks'
import {
  parseUserAgent,
  formatLastActive,
  formatLocation,
} from '@/lib/useragent'
import { toast } from '@/components/toast'

// ─── Account → Sessions ───
// Node 87:3081.

function DesktopIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='2'
        y='3.2'
        width='14'
        height='9.4'
        rx='1.6'
        stroke='currentColor'
        strokeWidth='1.4'
      />
      <path
        d='M6.4 15.2h5.2M9 12.6v2.6'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

function PhoneIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='4.6'
        y='1.8'
        width='8.8'
        height='14.4'
        rx='2'
        stroke='currentColor'
        strokeWidth='1.4'
      />
      <path
        d='M7.8 13.6h2.4'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
    </svg>
  )
}

// The circle is the form factor, the badge is the browser. Between them
// they answer "which of my devices is this" faster than the text does.
function deviceIconFor(os) {
  return os === 'iPhone' || os === 'Android' ? PhoneIcon : DesktopIcon
}

function SessionRow({ session, onSignOut, busy }) {
  const { browser, os, label } = parseUserAgent(session.userAgent)
  const DeviceIcon = deviceIconFor(os)
  const BrowserMark = browserMarkFor(browser)

  const location = formatLocation(session)
  const activity = formatLastActive(session.lastActiveAt, {
    isCurrent: session.isCurrent,
  })

  // The dot is a separator, so it only belongs between two things.
  const meta = [location, activity].filter(Boolean)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          minWidth: 0,
          flex: '1 0 0',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-default)',
              border: '1px solid var(--stroke-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-sub)',
            }}
          >
            <DeviceIcon size={18} />
          </div>

          <span
            style={{
              position: 'absolute',
              right: '-2px',
              bottom: '-2px',
              width: '14px',
              height: '14px',
              borderRadius: 'var(--radius-full)',
              background: '#ffffff',
              border: '1px solid var(--stroke-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-sub)',
            }}
          >
            <BrowserMark size={10} />
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
          }}
        >
          <p
            className='para-xs'
            style={{
              margin: 0,
              color: 'var(--text-strong)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            {meta.map((part, i) => (
              <span key={part} style={{ display: 'contents' }}>
                {i > 0 ? (
                  <span
                    aria-hidden='true'
                    style={{
                      width: '4px',
                      height: '4px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-full)',
                      // --bg-surface in the design, which is nearly white
                      // and effectively invisible between two grey labels.
                      // --bg-muted is the same family and actually reads.
                      background: 'var(--bg-muted)',
                    }}
                  />
                ) : null}
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    lineHeight: 1,
                    letterSpacing: '0.2px',
                    color: 'var(--text-soft)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {part}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {session.isCurrent ? (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flexShrink: 0,
            background: 'var(--bg-default)',
            border: '1px solid var(--stroke-soft)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0px 2px 2px rgba(54, 54, 54, 0.04)',
            padding: '6px 9px 6px 7px',
          }}
        >
          <span
            aria-hidden='true'
            style={{
              width: '6px',
              height: '6px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--success-base)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1,
              letterSpacing: '0.2px',
              color: 'var(--text-sub)',
              whiteSpace: 'nowrap',
            }}
          >
            This device
          </span>
        </div>
      ) : (
        <button
          type='button'
          onClick={onSignOut}
          disabled={busy}
          className='session-signout'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: '8px 18px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'var(--bg-surface)',
            color: 'var(--text-sub)',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.24px',
            whiteSpace: 'nowrap',
          }}
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      )}
    </div>
  )
}

function RowSkeleton() {
  return (
    <div
      aria-hidden='true'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div
          className='skeleton-pulse'
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div
            className='skeleton-pulse'
            style={{
              width: '116px',
              height: '12px',
              borderRadius: '4px',
              background: 'var(--bg-surface)',
            }}
          />
          <div
            className='skeleton-pulse'
            style={{
              width: '148px',
              height: '10px',
              borderRadius: '4px',
              background: 'var(--bg-surface)',
            }}
          />
        </div>
      </div>
      <div
        className='skeleton-pulse'
        style={{
          width: '84px',
          height: '32px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
        }}
      />
    </div>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState(null)
  const [signingOut, setSigningOut] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/sessions')
      .then((res) => {
        if (!res.ok) throw new Error(`sessions fetch failed: ${res.status}`)
        return res.json()
      })
      .then((d) => {
        if (!cancelled) setSessions(d.sessions || [])
      })
      .catch((err) => {
        console.error('[Sessions]', err)
        if (!cancelled) setSessions([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut(session) {
    if (signingOut) return
    setSigningOut(session.id)
    try {
      const res = await fetch('/api/me/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || "Couldn't sign that device out")
        return
      }
      // Removed locally rather than re-fetching: the row is gone either
      // way, and a refetch would make it linger for a round trip.
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      toast('Signed out on that device')
    } catch (err) {
      console.error('[Sessions]', err)
      toast.error("Couldn't sign that device out")
    } finally {
      setSigningOut(null)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        Active sessions
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
        }}
      >
        {sessions === null ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : sessions.length === 0 ? (
          // Reachable in a real way, not just as an error state: it's what
          // shows when sessions aren't stored in the database at all.
          <p
            className='para-xs'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            No active sessions to show.
          </p>
        ) : (
          sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              busy={signingOut === s.id}
              onSignOut={() => handleSignOut(s)}
            />
          ))
        )}
      </div>
    </div>
  )
}
