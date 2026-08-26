'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GradientAvatar, { seedFor } from '@/components/gradientavatar'

// ─── Nav account ───
// The Get started button, or the signed-in person's avatar.
//
// Someone who already has an account being asked to "Get started" is the site
// failing to recognise them — and the thing they actually want from the
// marketing page is the way back into the app.

export default function NavAccount({ compact = false }) {
  // Three states, and the third matters: `null` means we haven't asked yet.
  // Rendering the signed-out button while the check is in flight would flash
  // "Get started" at someone who's signed in, every single page load.
  const [user, setUser] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (cancelled) return
        // 401 is the signed-out answer, not an error — it resolves to null
        // above and falls through to the same place as a failed request.
        if (d?.user) setUser(d.user)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // A fixed-size placeholder rather than nothing, so the nav doesn't shift
  // when the answer arrives.
  if (!checked) {
    return (
      <span
        aria-hidden='true'
        style={{
          display: 'block',
          width: compact ? '34px' : '96px',
          height: '34px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface)',
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
    )
  }

  if (!user) {
    return (
      <Link
        href='/get-started'
        className='landing-pill'
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 22px',
          borderRadius: '48px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: '0.28px',
          background: 'var(--text-strong)',
          color: 'var(--bg-default)',
        }}
      >
        Get started
      </Link>
    )
  }

  const label = user.name || user.email

  return (
    <Link
      href='/dashboard/analytics'
      className='landing-account'
      // The destination in the label, not just the name. "Shater" alone
      // doesn't say it's a link anywhere, let alone into the app.
      aria-label={`Open Luotain as ${label}`}
      title={`Open Luotain as ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 4px 4px 12px',
        borderRadius: '48px',
        background: 'var(--bg-surface)',
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      {/* The name only where there's room. In the mobile sheet it's the avatar
          alone — a long name next to a burger crowds the bar. */}
      {!compact ? (
        <span
          className='landing-account-name'
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            lineHeight: '18px',
            letterSpacing: '0.28px',
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
            maxWidth: '140px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {user.name || 'Open app'}
        </span>
      ) : null}

      {user.image ? (
        <img
          src={user.image}
          alt=''
          width={30}
          height={30}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-full)',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <GradientAvatar
          seed={seedFor({ seed: user.avatarSeed, id: user.id, name: label })}
          name={label}
          size={30}
        />
      )}
    </Link>
  )
}
