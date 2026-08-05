'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import GradientAvatar from '@/components/gradientavatar'
import { toast } from '@/components/toast'

// ─── Account → Connected accounts ───
// Node 87:2912.
//
// The design shows Google connected and GitHub not, but which is which
// comes from the Account table — either could be in either state, and
// hardcoding Google as the connected one would break the moment someone
// signed up with GitHub.

function ArrowIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M5.5 12.5 12.5 5.5M12.5 5.5H7M12.5 5.5V11'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// The same assets the auth pages use — /public/assets/googlelogo.svg and
// githublogo.svg. Those already existed; I'd written inline SVG copies of
// both, which was a third version of a mark the project already had.
//
// Driven off the provider id so a new provider is a file plus a line, not a
// new component.
const PROVIDER_LOGOS = {
  google: '/assets/googlelogo.svg',
  github: '/assets/githublogo.svg',
}

function ProviderIcon({ id, size = 20 }) {
  const src = PROVIDER_LOGOS[id]
  if (!src) return null
  return (
    <img
      src={src}
      alt=''
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
    />
  )
}

function formatConnectedAt(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const day = d.getDate()
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = day % 100
  const ordinal = day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  return `${ordinal} ${d.toLocaleString('en-US', { month: 'long' })}, ${d.getFullYear()}`
}

// The connected card: the account it's linked to, with the provider's mark
// badged onto the avatar.
function ConnectedCard({ provider, user }) {
  return (
    <div
      style={{
        flex: '1 0 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        borderRadius: 'var(--radius-xl)',
        padding: '10px 14px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {user.image ? (
            <img
              src={user.image}
              alt=''
              width={32}
              height={32}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <GradientAvatar seed={user.avatarSeed} name={user.name} size={32} />
          )}

          {/* Badged bottom-right rather than the design's centre-left,
              which overlapped the avatar's face. The white ring is what
              keeps the mark legible against whatever it sits on. */}
          <span
            style={{
              position: 'absolute',
              right: '-3px',
              bottom: '-3px',
              width: '16px',
              height: '16px',
              borderRadius: 'var(--radius-full)',
              background: '#ffffff',
              border: '1px solid var(--stroke-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ProviderIcon id={provider.id} size={10} />
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            justifyContent: 'center',
            minWidth: 0,
            flex: '1 0 0',
          }}
        >
          <p
            className='para-xs'
            style={{
              margin: 0,
              color: 'var(--text-strong)',
              // Ellipsis rather than wrap: these cards sit side by side, so
              // a long name wrapping would make one card taller than the
              // other.
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.name || provider.label}
          </p>
          <p
            style={{
              margin: 0,
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
            {user.email}
          </p>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          lineHeight: '16px',
          letterSpacing: '0.2px',
          color: 'var(--text-sub)',
        }}
      >
        {provider.connectedAt
          ? `Connected ${formatConnectedAt(provider.connectedAt)}`
          : 'Connected'}
      </p>
    </div>
  )
}

// The unconnected card: the provider's name, and the action to link it.
function ConnectCard({ provider, busy, onConnect }) {
  return (
    <button
      type='button'
      onClick={onConnect}
      disabled={busy}
      className='connect-card'
      style={{
        flex: '1 0 0',
        minWidth: 0,
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '10px',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        borderRadius: 'var(--radius-xl)',
        padding: '10px 14px',
        boxSizing: 'border-box',
        cursor: busy ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ display: 'flex', color: 'var(--text-strong)' }}>
          <ProviderIcon id={provider.id} size={20} />
        </span>
        <span className='para-sm' style={{ color: 'var(--text-strong)' }}>
          {provider.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span className='para-sm' style={{ color: 'var(--text-strong)' }}>
          {busy ? 'Connecting…' : `Connect ${provider.label}`}
        </span>
        <span
          className='connect-arrow'
          style={{ display: 'flex', color: 'var(--text-strong)' }}
        >
          <ArrowIcon />
        </span>
      </div>
    </button>
  )
}

export default function ConnectedAccountsPage() {
  const [data, setData] = useState(null)
  const [connecting, setConnecting] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/accounts')
      .then((res) => {
        if (!res.ok) throw new Error(`accounts fetch failed: ${res.status}`)
        return res.json()
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err) => {
        console.error('[ConnectedAccounts]', err)
        if (!cancelled) setData({ user: null, providers: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleConnect(provider) {
    setConnecting(provider.id)
    try {
      // Linking is a full OAuth round trip, so this leaves the page and
      // comes back — there's no in-place version of it. callbackUrl brings
      // them back here rather than to the dashboard.
      await signIn(provider.id, {
        callbackUrl: '/dashboard/settings/connected-accounts',
      })
    } catch (err) {
      console.error('[ConnectedAccounts]', err)
      toast.error(`Couldn't connect ${provider.label}`)
      setConnecting(null)
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
        Connected accounts
      </p>

      {/* A skeleton until the real state is known, not the cards in a
          default state — that would flash "Connect Google" at someone who
          signed up with Google. Same footprint, so nothing moves. */}
      {!data ? (
        <div
          className='connect-cards'
          style={{ display: 'flex', gap: '8px', width: '100%' }}
        >
          <SettingsCardsSkeletonCards />
        </div>
      ) : (
        <div
          className='connect-cards'
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'stretch',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {data.providers.map((p) =>
            p.connected ? (
              <ConnectedCard key={p.id} provider={p} user={data.user} />
            ) : (
              <ConnectCard
                key={p.id}
                provider={p}
                busy={connecting === p.id}
                onConnect={() => handleConnect(p)}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

// Just the two card blocks — the heading above is already real, so the
// skeleton shouldn't render its own.
function SettingsCardsSkeletonCards() {
  return (
    <>
      <div
        className='skeleton-pulse'
        style={{
          flex: '1 0 0',
          height: '86px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
        }}
      />
      <div
        className='skeleton-pulse'
        style={{
          flex: '1 0 0',
          height: '86px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
        }}
      />
    </>
  )
}
