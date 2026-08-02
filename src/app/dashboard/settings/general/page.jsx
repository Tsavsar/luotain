'use client'

import { useEffect, useRef, useState } from 'react'
import Inputfield from '@/components/input'
import Tooltip from '@/components/tooltip'
import { toast } from '@/components/toast'

// ─── Account → General ───
// Node 87:2716.

// "Never" until the profile has actually been saved once. Relative for
// anything recent, because "2 minutes ago" is what confirms the save you
// just made — an absolute date would read as though it were historical.
function formatLastUpdated(iso) {
  if (!iso) return 'Never'
  const then = new Date(iso)
  const mins = Math.floor((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return then.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

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
        r='3.1'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M4.2 16.4c0-2.8 2.6-4.6 5.8-4.6s5.8 1.8 5.8 4.6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='2.6'
        y='4.6'
        width='14.8'
        height='10.8'
        rx='2.2'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='m3.4 6.4 5.5 4.1a1.8 1.8 0 0 0 2.2 0l5.5-4.1'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M6 7 10 3l4 4M10 12V3M3.9 15h12.2'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.6 6h12.8'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M8 6V4.8A1.3 1.3 0 0 1 9.3 3.5h1.4A1.3 1.3 0 0 1 12 4.8V6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5.2 6l.7 9.4A1.5 1.5 0 0 0 7.4 16.8h5.2a1.5 1.5 0 0 0 1.5-1.4L14.8 6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function AvatarRow({ image, name, onUpload, onRemove }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: '24px',
        // 20px on the right against the fields' 8px, kept from the design:
        // this is a 62px pill with a 24px radius, so its corner curve is far
        // deeper than an input's and icons at 8px would sit inside it.
        padding: '10px 20px 10px 10px',
        boxSizing: 'border-box',
      }}
    >
      {image ? (
        <img
          src={image}
          alt=''
          width={42}
          height={42}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-full)',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        // Initial rather than a generic silhouette — the design shows a
        // photo, and with none set an initial at least identifies the
        // account.
        <div
          aria-hidden='true'
          style={{
            width: '42px',
            height: '42px',
            flexShrink: 0,
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-sub)',
            fontFamily: 'var(--font-sans)',
            fontSize: '16px',
            letterSpacing: '0.32px',
          }}
        >
          {initial}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Tooltip label='Upload a photo'>
          <button
            type='button'
            onClick={onUpload}
            aria-label='Upload a photo'
            className='settings-icon-btn'
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--text-sub)',
            }}
          >
            <UploadIcon />
          </button>
        </Tooltip>

        {/* Only offered when there's actually a photo to remove — the
            design shows both icons unconditionally, but "remove" with
            nothing to remove is a button that can only disappoint. */}
        {image ? (
          <Tooltip label='Remove photo'>
            <button
              type='button'
              onClick={onRemove}
              aria-label='Remove photo'
              className='settings-icon-btn'
              style={{
                display: 'flex',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--text-sub)',
              }}
            >
              <TrashIcon />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  )
}

export default function SettingsGeneralPage() {
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState({
    name: '',
    email: '',
    image: null,
    profileUpdatedAt: null,
  })
  // What was last persisted, so "has anything changed" is a real
  // comparison rather than a flag someone has to remember to set.
  const [saved, setSaved] = useState({ name: '' })
  const [shaking, setShaking] = useState(false)
  const [errored, setErrored] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then((res) => {
        if (!res.ok) throw new Error(`profile fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setUser(data.user)
        setSaved({ name: data.user.name })
        setLoaded(true)
      })
      .catch((err) => {
        console.error('[SettingsGeneral]', err)
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const dirty = user.name.trim() !== saved.name.trim()

  function flagError() {
    setErrored(true)
    setShaking(true)
    timers.current.push(setTimeout(() => setShaking(false), 320))
    timers.current.push(setTimeout(() => setErrored(false), 2000))
  }

  async function handleSave() {
    if (saving || !dirty) return
    if (!user.name.trim()) {
      flagError()
      toast.error('Enter your name')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        flagError()
        toast.error(data?.error || "Couldn't save changes")
        return
      }
      setUser(data.user)
      setSaved({ name: data.user.name })
      toast('Changes saved')
    } catch (err) {
      console.error('[SettingsGeneral]', err)
      toast.error("Couldn't save changes")
    } finally {
      setSaving(false)
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
        General settings
      </p>

      {/* Everything fills the panel. The design has the avatar row at the
          panel's full width and the inputs at 360, so the row overhangs the
          fields below it — matching them at the panel width rather than the
          narrower one, since capping at 360 left a third of the panel empty
          and the fields looking stranded.

          Set once on the container rather than per child, which is how the
          mismatch happened in the first place. */}
      <div
        className='settings-field-group'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        <AvatarRow
          image={user.image}
          name={user.name}
          onUpload={() => {
            // TODO: needs somewhere to put the file. Avatar upload means
            // storage plus a write to User.image, and neither exists yet.
            toast('Photo upload is not built yet')
          }}
          onRemove={() => {
            toast('Photo upload is not built yet')
          }}
        />

        {/* 360px, not the panel's full 504 — per the design, and it keeps
            the fields at a comfortable reading width rather than stretching
            a name field across the whole panel. */}
        <div style={{ width: '100%' }}>
          <Inputfield
            lefticon={<PersonIcon />}
            placeholder={loaded ? 'Your name' : ''}
            value={user.name}
            onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            error={errored}
            shaking={shaking}
          />
        </div>

        {/* Read-only. Email is the account's login identity, so changing it
            needs the new address verified and a plan for the window where
            neither is confirmed. An input that looks editable and either
            silently fails or locks someone out is worse than one that
            says why not. */}
        <div style={{ width: '100%' }}>
          <Tooltip label='Email is your sign-in address'>
            <div style={{ width: '100%' }}>
              <Inputfield
                lefticon={<MailIcon />}
                value={user.email}
                onChange={() => {}}
                placeholder=''
                readOnly
              />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Disabled until something has actually changed. The design's grey
          Save button reads as exactly this state, so it's the default
          rather than a special case. */}
      <button
        type='button'
        onClick={handleSave}
        disabled={!dirty || saving}
        className='settings-save'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 18px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          cursor: !dirty || saving ? 'default' : 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          lineHeight: '16px',
          letterSpacing: '0.24px',
          background: dirty ? 'var(--text-strong)' : 'var(--bg-surface)',
          color: dirty ? 'var(--bg-default)' : 'var(--text-sub)',
          transition: 'background 0.2s ease, color 0.2s ease',
        }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          Last updated:
        </span>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          {formatLastUpdated(user.profileUpdatedAt)}
        </span>
      </div>
    </div>
  )
}
