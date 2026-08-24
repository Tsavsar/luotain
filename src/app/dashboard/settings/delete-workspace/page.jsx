'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Inputfield from '@/components/input'
import { toast } from '@/components/toast'

// ─── Organisation → Delete workspace ───
// The same shape as Account → Delete account: spell out what goes, make them
// type the name, and only then enable the button.
//
// Typing the WORKSPACE NAME rather than an email. It's the thing being deleted,
// and on an account with several workspaces an email would confirm nothing
// about which one you're on.

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

export default function DeleteWorkspacePage() {
  const router = useRouter()
  const [org, setOrg] = useState(null)
  const [role, setRole] = useState(null)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [errored, setErrored] = useState(false)
  const [shaking, setShaking] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/org').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/org/members').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([o, m]) => {
        if (cancelled) return
        if (o?.organization) setOrg(o.organization)
        if (m?.role) setRole(m.role)
      })
      .catch((err) => console.error('[DeleteWorkspace]', err))
    return () => {
      cancelled = true
    }
  }, [])

  const matches =
    Boolean(org?.name) &&
    typed.trim().toLowerCase() === org.name.trim().toLowerCase()

  function flag() {
    setErrored(true)
    setShaking(true)
    timers.current.push(setTimeout(() => setShaking(false), 320))
    timers.current.push(setTimeout(() => setErrored(false), 2000))
  }

  async function handleDelete() {
    if (!matches || deleting) {
      // A mistyped confirmation shakes rather than silently doing nothing —
      // a disabled button that gives no feedback reads as broken.
      if (!matches) flag()
      return
    }

    setDeleting(true)
    try {
      const res = await fetch('/api/org/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: typed.trim() }),
      })
      const d = await res.json().catch(() => null)

      if (!res.ok) {
        if (d?.field) flag()
        toast.error(d?.error || `Couldn't delete the workspace (${res.status})`)
        setDeleting(false)
        return
      }

      // Switched to another workspace before landing, or the dashboard would
      // load with an active org that no longer exists.
      if (d.nextOrganizationId) {
        await fetch('/api/switch-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // `orgId`, which is what /api/switch-org reads — not
          // organizationId, the name used everywhere else.
          body: JSON.stringify({ orgId: d.nextOrganizationId }),
        }).catch(() => {})
      }

      // A full reload, not a router push. Half the app holds the old workspace
      // in state — the header, the org switcher, every cached list — and a
      // client navigation would carry all of it into a workspace that's gone.
      window.location.href = '/dashboard/analytics'
    } catch (err) {
      console.error('[DeleteWorkspace]', err)
      toast.error("Couldn't delete the workspace")
      setDeleting(false)
    }
  }

  const isOwner = role === 'OWNER'

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
          Delete workspace
        </p>
        <p className='para-xs' style={{ color: 'var(--text-sub)', margin: 0 }}>
          Permanently delete {org?.name || 'this workspace'} and everything in
          it. This action is immediate and cannot be undone.
        </p>
        {/* Named individually rather than as "all data". Someone deciding this
            needs to know that the analytics go too — that's usually the part
            people assume survives. */}
        <p className='para-xs' style={{ color: 'var(--text-sub)', margin: 0 }}>
          Every link, QR code and click record is deleted, along with any custom
          domains and pending invites. Short links on this workspace stop
          resolving straight away, including any already printed or shared.
        </p>
        <p className='para-xs' style={{ color: 'var(--text-sub)', margin: 0 }}>
          Other members lose access. Their accounts stay, and so do the other
          workspaces they belong to.
        </p>

        {isOwner ? (
          <p
            className='para-xs'
            style={{ color: 'var(--text-sub)', margin: 0, paddingTop: '10px' }}
          >
            To delete this workspace, type in its name below.
          </p>
        ) : null}
      </div>

      {/* Only the owner sees the field. Showing a control that always 403s
          would be offering something that can't happen. */}
      {isOwner ? (
        <>
          <div className='settings-field-group' style={{ width: '100%' }}>
            <Inputfield
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value)
                setErrored(false)
              }}
              onKeyDown={(e) => {
                // Enter only once it matches. A stray Enter mid-typing must not
                // be able to fire a destructive action.
                if (e.key === 'Enter' && matches) handleDelete()
              }}
              error={errored}
              shaking={shaking}
              tone='error'
            />
          </div>

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
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: !matches || deleting ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              background: matches ? 'var(--error-base)' : 'var(--error-mute)',
              color: matches ? 'var(--text-inverse)' : 'var(--error-base)',
            }}
          >
            {deleting ? <Spinner /> : null}
            {deleting ? 'Deleting' : 'Delete workspace'}
          </button>
        </>
      ) : (
        <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
          Only the workspace owner can delete it.
        </p>
      )}
    </div>
  )
}
