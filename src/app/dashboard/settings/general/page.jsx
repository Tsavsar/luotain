'use client'

import { useEffect, useRef, useState } from 'react'
import Inputfield from '@/components/input'
import Tooltip from '@/components/tooltip'
import AvatarRow from '@/components/avatarrow'
import SaveBar from '@/components/savebar'
import Alert, { AlertAction, AlertInfoIcon } from '@/components/alert'
import { SettingsGeneralSkeleton } from '@/components/settingsskeleton'
import { getProfile, primeProfile } from '@/lib/profilecache'
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
  // Only shown once someone actually tries to leave. Standing open the
  // whole time you're typing is nagging — the Save button already says
  // there's something to save. This is a reaction, not a status readout.
  const [warnOpen, setWarnOpen] = useState(false)
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
    // Served from cache when the layout has already read it, so arriving
    // at settings from anywhere in the dashboard is instant.
    getProfile()
      .then((user) => {
        if (cancelled) return
        const next = {
          name: user.name,
          image: user.image,
          avatarSeed: user.avatarSeed,
        }
        setDraft(next)
        setSaved(next)
        setEmail(user.email)
        setProfileUpdatedAt(user.profileUpdatedAt)
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
      setWarnOpen(true)
      // Re-shakes on every attempt. A banner that's already open and does
      // nothing when you try again reads as broken.
      setWarnShaking(true)
      timers.current.push(setTimeout(() => setWarnShaking(false), 400))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [dirty])

  // Saving or discarding resolves it, so the banner closes on its own
  // rather than lingering after the reason for it is gone.
  useEffect(() => {
    if (!dirty) setWarnOpen(false)
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
      // Written straight into the cache rather than left to be re-fetched:
      // the response already IS the new profile.
      primeProfile(data.user)
      // Tells the dashboard layout to re-read, so the header avatar updates
      // without a reload.
      window.dispatchEvent(new Event('luotain:profile-updated'))
      toast('Changes saved')
    } catch (err) {
      console.error('[SettingsGeneral]', err)
      toast.error("Couldn't save changes")
    } finally {
      setSaving(false)
    }
  }

  // The form's shape, at the real sizes, so nothing shifts when it fills
  // in. Rendering the empty form instead would show blank fields that then
  // populate, which reads as the page having loaded wrong.
  if (!loaded) return <SettingsGeneralSkeleton />

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
        className={`unsaved-banner${warnOpen ? ' is-open' : ''}${warnShaking ? ' is-shaking' : ''}`}
        // Width is in CSS, not here — an inline cap can't be undone by a
        // media query, and this needs to go full width on mobile.
        style={{ width: '100%' }}
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

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onDiscard={() => setDraft(saved)}
      />

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
