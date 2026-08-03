'use client'

import { useEffect, useRef, useState } from 'react'
import Inputfield from '@/components/input'
import Tooltip from '@/components/tooltip'
import GradientAvatar from '@/components/gradientavatar'
import Alert, { AlertAction, AlertInfoIcon } from '@/components/alert'
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
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      {/* The asset ships with #D1D1D1, which is exactly --bg-muted — but
          currentColor here instead, so it follows Inputfield's own icon
          logic: soft when empty, strong once there's a value, grey when
          read-only. A fixed fill would ignore all three. */}
      <path
        d='M10 8C11.3807 8 12.5 6.88071 12.5 5.5C12.5 4.11929 11.3807 3 10 3C8.61929 3 7.5 4.11929 7.5 5.5C7.5 6.88071 8.61929 8 10 8Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M14.6642 16.455C15.6112 16.234 16.1332 15.152 15.6552 14.305C14.5412 12.332 12.4282 11 10.0002 11C7.57219 11 5.45919 12.332 4.34519 14.305C3.86719 15.152 4.38919 16.234 5.33619 16.455C8.44619 17.182 11.5552 17.182 14.6652 16.455H14.6642Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
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

// Uses the project's existing .btn-spinner keyframes rather than a second
// spin animation. The gap in the ring is what makes rotation legible — a
// full ring spinning looks static.
function Spinner({ size = 14 }) {
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

function DiceIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <rect
        x='3.2'
        y='3.2'
        width='13.6'
        height='13.6'
        rx='3.4'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <circle cx='7.2' cy='7.2' r='1.15' fill='currentColor' />
      <circle cx='12.8' cy='12.8' r='1.15' fill='currentColor' />
      <circle cx='12.8' cy='7.2' r='1.15' fill='currentColor' />
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

function AvatarRow({
  image,
  name,
  seed,
  busy,
  swapping,
  rolling,
  onUpload,
  onRemove,
  onReroll,
}) {
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
      {/* Blur swap, same treatment as the slug regenerate: the old avatar
          blurs out, the new one lands while it's unreadable, then it blurs
          back. A hard cut between two gradients reads as a glitch. */}
      <div
        className={`avatar-swap${swapping ? ' is-swapping' : ''}`}
        style={{ display: 'flex', flexShrink: 0 }}
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
          // No photo means a generated gradient rather than a grey circle.
          // Derived from the seed, so it's stable across sessions and
          // devices without anything being uploaded.
          <GradientAvatar seed={seed} name={name} size={42} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Only offered when there's no photo — re-rolling a gradient
            nobody can see would do nothing visible. */}
        {!image ? (
          <Tooltip label='New gradient'>
            <button
              type='button'
              onClick={onReroll}
              disabled={busy}
              aria-label='Generate a new gradient'
              className='settings-icon-btn'
              style={{
                display: 'flex',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: busy ? 'default' : 'pointer',
                color: 'var(--text-sub)',
              }}
            >
              <span
                className={rolling ? 'dice-roll' : undefined}
                style={{ display: 'flex' }}
              >
                <DiceIcon />
              </span>
            </button>
          </Tooltip>
        ) : null}

        <Tooltip label='Upload a photo'>
          <button
            type='button'
            onClick={onUpload}
            disabled={busy}
            aria-label='Upload a photo'
            className='settings-icon-btn'
            style={{
              display: 'flex',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: busy ? 'default' : 'pointer',
              color: 'var(--text-sub)',
            }}
          >
            {busy ? <Spinner size={18} /> : <UploadIcon />}
          </button>
        </Tooltip>

        {/* Only when there's actually a photo to remove — the design shows
            both icons unconditionally, but "remove" with nothing to remove
            is a button that can only disappoint. */}
        {image ? (
          <Tooltip label='Remove photo'>
            <button
              type='button'
              onClick={onRemove}
              disabled={busy}
              aria-label='Remove photo'
              className='settings-icon-btn'
              style={{
                display: 'flex',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: busy ? 'default' : 'pointer',
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

// Resized before upload rather than sent raw. A phone photo is several
// megabytes; an avatar is displayed at 42px. Resizing client-side means the
// request is tens of kilobytes instead of megabytes, and it's the reason
// storing the image inline in the database is viable at all.
const AVATAR_PX = 256

function resizeToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image'))
      img.onload = () => {
        // Square crop from the centre, so a portrait photo doesn't end up
        // squashed into a circle.
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2

        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_PX
        canvas.height = AVATAR_PX
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_PX, AVATAR_PX)
        // JPEG at 0.82: at this size the difference from lossless is
        // invisible and the payload is roughly a tenth the size.
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

const QUIPS = [
  'Looking good',
  'Nice one',
  'That suits you',
  'Very sharp',
  'Great pick',
]

export default function SettingsGeneralPage() {
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Everything on this page is STAGED and persisted by Save — including the
  // avatar. Writing avatar changes immediately would mean two different
  // save models on one screen, and the unsaved-changes warning below would
  // only ever be watching the name field.
  const [draft, setDraft] = useState({
    name: '',
    image: null,
    avatarSeed: null,
  })
  const [saved, setSaved] = useState({
    name: '',
    image: null,
    avatarSeed: null,
  })
  const [email, setEmail] = useState('')
  const [profileUpdatedAt, setProfileUpdatedAt] = useState(null)

  const [shaking, setShaking] = useState(false)
  const [errored, setErrored] = useState(false)
  const [avatarSwapping, setAvatarSwapping] = useState(false)
  const [diceRolling, setDiceRolling] = useState(false)
  const [warnShaking, setWarnShaking] = useState(false)

  const fileRef = useRef(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const dirty =
    draft.name.trim() !== saved.name.trim() ||
    draft.image !== saved.image ||
    draft.avatarSeed !== saved.avatarSeed

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then((res) => {
        if (!res.ok) throw new Error(`profile fetch failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const next = {
          name: data.user.name,
          image: data.user.image,
          avatarSeed: data.user.avatarSeed,
        }
        setDraft(next)
        setSaved(next)
        setEmail(data.user.email)
        setProfileUpdatedAt(data.user.profileUpdatedAt)
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

  // ─── Leaving with unsaved changes ───
  // Two different exits, two mechanisms.
  //
  // A real page unload (tab close, refresh, external link) can only be
  // handled by beforeunload, and the browser shows its own dialog — we
  // can't style that.
  //
  // In-app navigation is a click on a link that never reaches the network,
  // so beforeunload never fires. This catches those in the capture phase,
  // before Next's router sees them, and shows the banner instead.
  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(e) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (!dirty) return
    function onClick(e) {
      const link = e.target.closest?.('a[href]')
      if (!link) return
      const href = link.getAttribute('href')
      // Only internal navigation away from this page. An anchor, a new tab,
      // or an external link isn't losing anything.
      if (
        !href ||
        !href.startsWith('/') ||
        href.startsWith('/dashboard/settings/general')
      )
        return
      if (link.target === '_blank' || e.metaKey || e.ctrlKey) return

      e.preventDefault()
      e.stopPropagation()
      // Re-shake on every attempt. A banner that's already visible and
      // does nothing when you try again reads as broken.
      setWarnShaking(true)
      timers.current.push(setTimeout(() => setWarnShaking(false), 400))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [dirty])

  function flagError() {
    setErrored(true)
    setShaking(true)
    timers.current.push(setTimeout(() => setShaking(false), 320))
    timers.current.push(setTimeout(() => setErrored(false), 2000))
  }

  // Blur out, change underneath, blur back — so the avatar never hard-cuts
  // between two images.
  function swapAvatar(next) {
    setAvatarSwapping(true)
    timers.current.push(
      setTimeout(() => {
        setDraft((d) => ({ ...d, ...next }))
        setAvatarSwapping(false)
      }, 140)
    )
  }

  function handleReroll() {
    setDiceRolling(true)
    timers.current.push(setTimeout(() => setDiceRolling(false), 600))
    // Generated here rather than on the server, so the gradient being
    // previewed is exactly the one that gets saved.
    swapAvatar({
      avatarSeed: Math.random().toString(36).slice(2, 12),
      image: null,
    })
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    // Reset immediately, or picking the same file twice in a row does
    // nothing — the input's value wouldn't have changed.
    e.target.value = ''
    if (!file) return

    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      toast.error('Use a PNG, JPEG or WebP')
      return
    }
    // Checked before reading, so an enormous file isn't loaded into memory
    // just to be rejected.
    if (file.size > 10 * 1024 * 1024) {
      toast.error('That image is over 10MB')
      return
    }

    setUploading(true)
    try {
      const dataUrl = await resizeToDataUrl(file)
      swapAvatar({ image: dataUrl })
      toast(QUIPS[Math.floor(Math.random() * QUIPS.length)])
    } catch (err) {
      console.error('[SettingsGeneral]', err)
      toast.error(err.message || "Couldn't read that image")
    } finally {
      setUploading(false)
    }
  }

  function handleDiscard() {
    swapAvatar({ image: saved.image, avatarSeed: saved.avatarSeed })
    setDraft((d) => ({ ...d, name: saved.name }))
  }

  async function handleSave() {
    if (saving || !dirty) return
    if (!draft.name.trim()) {
      flagError()
      toast.error('Enter your name')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          // Only what actually changed. Sending the image on every save
          // would push a base64 payload up for a name edit.
          ...(draft.image !== saved.image
            ? draft.image
              ? { image: draft.image }
              : { removeImage: true }
            : {}),
          ...(draft.avatarSeed !== saved.avatarSeed
            ? { avatarSeed: draft.avatarSeed }
            : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.field === 'name') flagError()
        toast.error(data?.error || "Couldn't save changes")
        return
      }
      const next = {
        name: data.user.name,
        image: data.user.image,
        avatarSeed: data.user.avatarSeed,
      }
      setDraft(next)
      setSaved(next)
      setProfileUpdatedAt(data.user.profileUpdatedAt)
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

      {/* Drops down when there's something unsaved, and shakes again on
          each attempt to leave. The same Alert as the deleted-link notice,
          so an inline warning looks the same wherever it appears. */}
      <div
        className={`unsaved-banner${dirty ? ' is-open' : ''}${warnShaking ? ' is-shaking' : ''}`}
        style={{ width: '100%', maxWidth: '360px' }}
      >
        <Alert
          variant='inline'
          icon={<AlertInfoIcon />}
          message='You have unsaved changes'
          action={
            <AlertAction onClick={handleDiscard} disabled={saving}>
              Discard
            </AlertAction>
          }
        />
      </div>

      <div
        className='settings-field-group'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-start',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        {/* Hidden input rather than a styled file control — file inputs
            can't be restyled reliably across browsers, so the icon button
            triggers this instead. */}
        <input
          ref={fileRef}
          type='file'
          accept='image/png,image/jpeg,image/webp'
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        <AvatarRow
          image={draft.image}
          name={draft.name}
          seed={draft.avatarSeed}
          busy={uploading}
          swapping={avatarSwapping}
          rolling={diceRolling}
          onUpload={() => fileRef.current?.click()}
          onRemove={() => swapAvatar({ image: null })}
          onReroll={handleReroll}
        />

        <div style={{ width: '100%' }}>
          <Inputfield
            lefticon={<PersonIcon />}
            placeholder={loaded ? 'Your name' : ''}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            error={errored}
            shaking={shaking}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Tooltip label='Contact support to change your email' fullWidth>
            <div style={{ width: '100%' }}>
              <Inputfield
                lefticon={<MailIcon />}
                value={email}
                onChange={() => {}}
                placeholder=''
                readOnly
              />
            </div>
          </Tooltip>
        </div>
      </div>

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
        {saving ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Spinner size={13} />
            Saving
          </span>
        ) : (
          'Save changes'
        )}
      </button>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          Last updated:
        </span>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          {formatLastUpdated(profileUpdatedAt)}
        </span>
      </div>
    </div>
  )
}
