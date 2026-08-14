'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LogoMark from '@/components/logomark'
import Inputfield from '@/components/input'
import Continuebutton from '@/components/continuebutton'
import GradientAvatar, { seedFor } from '@/components/gradientavatar'
import { toast } from '@/components/toast'

// ─── Accept an invite ───
// The auth shell, with the workspace named at the top.
//
// One field, and only when it's needed: someone who already has an account is
// asked for nothing at all, because everything required is already known.

function PersonIcon() {
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
        cy='6.8'
        r='3.3'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M3.8 17c0-3.1 2.8-5.2 6.2-5.2s6.2 2.1 6.2 5.2'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

function Shell({ children }) {
  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        paddingTop: '120px',
        paddingLeft: '20px',
        paddingRight: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '360px',
          maxWidth: '100%',
          gap: '18px',
        }}
      >
        {children}
      </div>
    </main>
  )
}

export default function AcceptInvitePage() {
  const { token } = useParams()
  const router = useRouter()

  const [state, setState] = useState('loading') // loading | ready | error
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [shaking, setShaking] = useState(false)
  const [fieldError, setFieldError] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        const d = await res.json().catch(() => null)
        if (cancelled) return
        if (!res.ok) {
          setError(d?.error || 'This invite link is not valid')
          setState('error')
          return
        }
        setData(d)
        if (d.knownName) setName(d.knownName)
        setState('ready')
      })
      .catch((err) => {
        console.error('[AcceptInvite]', err)
        if (cancelled) return
        setError("Couldn't load this invite")
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  function flag() {
    setFieldError(true)
    setShaking(true)
    timers.current.push(setTimeout(() => setShaking(false), 320))
    timers.current.push(setTimeout(() => setFieldError(false), 2000))
  }

  // A name is only required when there's no account to take one from.
  const needsName = data ? !data.hasAccount : false
  const canContinue = !needsName || name.trim().length > 0

  async function handleAccept() {
    if (!canContinue) {
      flag()
      toast.error('Enter your name')
      return
    }

    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const d = await res.json().catch(() => null)

      if (!res.ok) {
        if (d?.field === 'name') flag()
        toast.error(d?.error || `Couldn't accept the invite (${res.status})`)
        return
      }

      toast(`Welcome to ${d.orgName}`)
      // Straight in. Accepting already signed them in, so a login screen here
      // would be a second hurdle for one intention.
      router.push('/dashboard/analytics')
    } catch (err) {
      console.error('[AcceptInvite]', err)
      toast.error("Couldn't accept the invite")
    }
  }

  if (state === 'loading') {
    return (
      <Shell>
        <div
          className='skeleton-pulse'
          style={{
            width: '39px',
            height: '42px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '240px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '42px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
          }}
        />
      </Shell>
    )
  }

  if (state === 'error') {
    return (
      <Shell>
        <div className='luotain-logo'>
          <LogoMark size={39} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1
            className='label-lg'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            This invite isn&rsquo;t valid
          </h1>
          <p
            className='para-sm'
            style={{ color: 'var(--text-sub)', margin: 0 }}
          >
            {error} Ask whoever invited you to send a new one.
          </p>
        </div>
        <button
          type='button'
          onClick={() => router.push('/login')}
          className='discard-changes'
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
          Go to sign in
        </button>
      </Shell>
    )
  }

  const inv = data.invite

  return (
    <Shell>
      <div className='luotain-logo'>
        <LogoMark size={39} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* The workspace, shown rather than just named. It's the thing being
            joined, and its avatar is what someone will recognise from the app
            once they're in. */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {inv.orgImage ? (
            <img
              src={inv.orgImage}
              alt=''
              width={32}
              height={32}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <GradientAvatar
              seed={seedFor({
                seed: inv.orgAvatarSeed,
                id: inv.orgId,
                name: inv.orgName,
              })}
              name={inv.orgName}
              size={32}
            />
          )}
          <p
            className='para-sm'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            {inv.orgName}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1
            className='label-lg'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            Welcome to {inv.orgName}
          </h1>
          <p
            className='para-sm'
            style={{ color: 'var(--text-sub)', margin: 0 }}
          >
            {/* Who invited you, when we know — an invite from a name is one you
                can place; an invite from nobody is one you distrust. */}
            {inv.invitedBy
              ? `${inv.invitedBy} invited you`
              : "You've been invited"}{' '}
            to join as {inv.role === 'ADMIN' ? 'an admin' : 'a member'}. This is
            for {inv.email}.
          </p>
        </div>
      </div>

      {needsName ? (
        <Inputfield
          lefticon={<PersonIcon />}
          placeholder='Your name'
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setFieldError(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAccept()
          }}
          error={fieldError}
          shaking={shaking}
        />
      ) : null}

      <Continuebutton
        active={canContinue}
        label={needsName ? 'Join workspace' : `Join ${inv.orgName}`}
        shaking={shaking}
        onClick={handleAccept}
      />

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          lineHeight: 1.5,
          letterSpacing: '0.2px',
          color: 'var(--text-soft)',
        }}
      >
        {/* Says what happens next. Joining creates an account if there isn't
            one, which someone should know before they press the button rather
            than discover afterwards. */}
        {data.hasAccount
          ? 'You already have a Luotain account for this address.'
          : 'Joining creates your Luotain account for this address.'}
      </p>
    </Shell>
  )
}
