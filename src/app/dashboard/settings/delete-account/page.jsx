'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import Inputfield from '@/components/input'
import { toast } from '@/components/toast'
import { getProfile } from '@/lib/profilecache'

// ─── Account → Delete account ───
// Node 87:3160.

function MailIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <path
        d='M9 17V15'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M15 6C15 7.654 13.654 9 12 9C11.448 9 11 8.552 11 8C11 7.448 11.448 7 12 7C12.552 7 13 6.551 13 6V5.816C12.153 5.514 11.481 4.845 11.178 4H6C3.794 4 2 5.794 2 8V13.5C2 14.878 3.122 16 4.5 16H15.5C16.878 16 18 14.878 18 13.5V8C18 6.95 17.585 6 16.92 5.286C16.398 5.725 15.734 6 15 6ZM8 14H4.5C4.224 14 4 13.776 4 13.5V8C4 6.897 4.897 6 6 6C7.103 6 8 6.897 8 8V14Z'
        fill='currentColor'
      />
      <path
        d='M15 1H12C11.4477 1 11 1.44772 11 2V3C11 3.55228 11.4477 4 12 4H15C15.5523 4 16 3.55228 16 3V2C16 1.44772 15.5523 1 15 1Z'
        fill='currentColor'
      />
      <path
        d='M12 3V6'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function Spinner({ size = 13 }) {
  return (
    <svg
      className='btn-spinner'
      width={size}
      height={size}
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

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [errored, setErrored] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((u) => {
        if (!cancelled) setEmail(u.email || '')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Case-insensitive: requiring someone to match capitalisation on their own
  // address adds no safety, it just makes a deliberate action feel broken.
  const matches =
    Boolean(email) && typed.trim().toLowerCase() === email.toLowerCase()

  async function handleDelete() {
    if (deleting) return
    if (!matches) {
      // Shouldn't be reachable — the button is disabled — but the check stays,
      // because the one thing this screen must never do is delete on a
      // mistyped confirmation.
      setErrored(true)
      setShaking(true)
      timers.current.push(setTimeout(() => setShaking(false), 320))
      timers.current.push(setTimeout(() => setErrored(false), 2000))
      return
    }

    setDeleting(true)
    try {
      const res = await fetch('/api/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: typed.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || "Couldn't delete your account")
        setDeleting(false)
        return
      }

      // NextAuth's own session has to be cleared too, not just the app cookie
      // — OAuth users hold both, and leaving the NextAuth one behind would
      // bounce them straight back into a signed-in state for an account that
      // no longer exists.
      //
      // Deliberately not toasting success: the redirect is the confirmation,
      // and a toast on a page that's being torn down is unlikely to be seen.
      await signOut({ callbackUrl: '/' })
    } catch (err) {
      console.error('[DeleteAccount]', err)
      toast.error("Couldn't delete your account")
      setDeleting(false)
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%',
        }}
      >
        <p
          className='label-sm'
          style={{ color: 'var(--error-base)', margin: 0 }}
        >
          Delete account
        </p>
        <p className='para-xs' style={{ color: 'var(--text-sub)', margin: 0 }}>
          Permanently delete your account and all associated projects. This
          action is immediate and cannot be undone.
        </p>
        {/* Spelled out rather than left implicit. The design's copy says "all
            associated projects", which is vaguer than what actually happens —
            and the distinction matters: workspaces you share with someone else
            survive, workspaces only you belong to do not. Someone deciding
            whether to do this needs to know which of theirs is which. */}
        <p className='para-xs' style={{ color: 'var(--text-sub)', margin: 0 }}>
          Workspaces where you&rsquo;re the only member will be deleted along
          with their links, QR codes and analytics. Workspaces you share with
          others will stay, and your links in them will remain.
        </p>
        <p
          className='para-xs'
          style={{ color: 'var(--text-sub)', margin: 0, paddingTop: '10px' }}
        >
          To delete your account, type in your email address below.
        </p>
      </div>

      <div className='settings-field-group' style={{ width: '100%' }}>
        <Inputfield
          lefticon={<MailIcon />}
          placeholder={email || 'your@email.com'}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            // Enter only submits once it matches. On a destructive action, a
            // stray Enter mid-typing shouldn't be able to fire it.
            if (e.key === 'Enter' && matches) handleDelete()
          }}
          error={errored}
          shaking={shaking}
        />
      </div>

      {/* Disabled until the email matches. The design shows it always active
          in error-mute, but then typing your address confirms nothing — the
          button would delete on the first click regardless. Gating it is the
          entire reason the field exists. */}
      <button
        type='button'
        onClick={handleDelete}
        disabled={!matches || deleting}
        className='delete-account-btn'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          background: matches ? 'var(--error-base)' : 'var(--error-mute)',
          color: matches ? 'var(--text-inverse)' : 'var(--error-base)',
          cursor: !matches || deleting ? 'default' : 'pointer',
          // Muted while it can't be used, so the state is legible without
          // reading the label.
          opacity: matches ? 1 : 0.65,
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          lineHeight: '16px',
          letterSpacing: '0.24px',
          transition:
            'background var(--duration-fast) ease, color var(--duration-fast) ease, opacity var(--duration-fast) ease',
        }}
      >
        {deleting ? (
          <>
            <Spinner />
            Deleting
          </>
        ) : (
          'Delete account'
        )}
      </button>
    </div>
  )
}
