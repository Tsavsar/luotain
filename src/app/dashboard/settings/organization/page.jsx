'use client'

import { useEffect, useRef, useState } from 'react'
import AvatarRow, { Spinner } from '@/components/avatarrow'
import Inputfield from '@/components/input'
import { toast } from '@/components/toast'
import { seedFor } from '@/components/gradientavatar'

// ─── Organisation → General ───
// Node 87:3266. The same shape as Account → General, deliberately: they're the
// same job on a different record, and the avatar row is now literally the same
// component.

function BuildingIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3.5 17.5V4.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v13M11.5 8.5h4a1 1 0 0 1 1 1v8M2 17.5h16'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M6 7h2M6 10.5h2M6 14h2M14 12h.5M14 15h.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  )
}

// Relative while recent, absolute once it isn't. Matches the account page's
// wording rather than inventing a second format.
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

// Shared with the account page's upload: resized and re-encoded client-side so
// a 6MB phone photo doesn't become a 6MB row in the database.
function resizeToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 256
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () =>
        reject(
          new Error(
            "This browser can't read that image format — try a JPEG or PNG"
          )
        )
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error("Couldn't read that file"))
    reader.readAsDataURL(file)
  })
}

export default function OrganizationSettingsPage() {
  // Staged, like the account page: nothing is written until Save, so a
  // half-typed workspace name never reaches the other members.
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [errors, setErrors] = useState({})
  const [shaking, setShaking] = useState({})
  const fileRef = useRef(null)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/org')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (cancelled || !d?.organization) return
        const o = d.organization
        const next = {
          name: o.name || '',
          image: o.image || null,
          avatarSeed: o.avatarSeed || null,
          updatedAt: o.updatedAt || null,
          id: o.id,
        }
        setSaved(next)
        setDraft(next)
      })
      .catch((err) => console.error('[OrgSettings]', err))
    return () => {
      cancelled = true
    }
  }, [])

  const dirty =
    Boolean(draft && saved) &&
    (draft.name !== saved.name ||
      draft.image !== saved.image ||
      draft.avatarSeed !== saved.avatarSeed)

  function flagError(fields) {
    setErrors(fields)
    setShaking(fields)
    timers.current.push(setTimeout(() => setShaking({}), 320))
    timers.current.push(setTimeout(() => setErrors({}), 2000))
  }

  function handleReroll() {
    setRolling(true)
    timers.current.push(setTimeout(() => setRolling(false), 620))
    setSwapping(true)
    timers.current.push(setTimeout(() => setSwapping(false), 200))
    setDraft((d) => ({
      ...d,
      avatarSeed: Math.random().toString(36).slice(2, 12),
    }))
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    // Reset so choosing the SAME file twice still fires a change event.
    e.target.value = ''
    if (!file) return

    if (file.type && !file.type.startsWith('image/')) {
      toast.error("That doesn't look like an image")
      return
    }

    setBusy(true)
    try {
      const dataUrl = await resizeToDataUrl(file)
      setSwapping(true)
      timers.current.push(setTimeout(() => setSwapping(false), 200))
      setDraft((d) => ({ ...d, image: dataUrl }))
    } catch (err) {
      console.error('[OrgSettings]', err)
      toast.error(err.message || "Couldn't read that image")
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!dirty || saving) return
    if (!draft.name.trim()) {
      flagError({ name: true })
      toast.error('Give the workspace a name')
      return
    }

    setSaving(true)
    try {
      // Only what changed, so a rename can't quietly re-send a 200KB image.
      const patch = { name: draft.name.trim() }
      if (draft.image !== saved.image) {
        if (draft.image) patch.image = draft.image
        else patch.removeImage = true
      }
      if (draft.avatarSeed !== saved.avatarSeed) {
        patch.avatarSeed = draft.avatarSeed
      }

      const res = await fetch('/api/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        if (data?.field) flagError({ [data.field]: true })
        toast.error(data?.error || `Couldn't save (${res.status})`)
        return
      }

      const o = data.organization
      const next = {
        name: o.name || '',
        image: o.image || null,
        avatarSeed: o.avatarSeed || null,
        updatedAt: o.updatedAt || null,
        id: o.id,
      }
      setSaved(next)
      setDraft(next)
      toast('Workspace updated')
    } catch (err) {
      console.error('[OrgSettings]', err)
      toast.error("Couldn't save the workspace")
    } finally {
      setSaving(false)
    }
  }

  if (!draft) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
        }}
      >
        <div
          className='skeleton-pulse'
          style={{
            width: '116px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '62px',
            borderRadius: '24px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '360px',
            maxWidth: '100%',
            height: '42px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
          }}
        />
      </div>
    )
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        <AvatarRow
          image={draft.image}
          name={draft.name}
          // Falls back to the org id so a workspace with no seed still gets a
          // stable gradient rather than a new one on every render.
          seed={seedFor({
            seed: draft.avatarSeed,
            id: draft.id,
            name: draft.name,
          })}
          busy={busy}
          swapping={swapping}
          rolling={rolling}
          onUpload={() => fileRef.current?.click()}
          onRemove={() => setDraft((d) => ({ ...d, image: null }))}
          onReroll={handleReroll}
        />

        <input
          ref={fileRef}
          type='file'
          accept='image/*,.heic,.heif'
          onChange={handleFile}
          style={{ display: 'none' }}
        />

        <div style={{ width: '360px', maxWidth: '100%' }}>
          <Inputfield
            lefticon={<BuildingIcon />}
            placeholder='Workspace name'
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            error={Boolean(errors.name)}
            shaking={Boolean(shaking.name)}
          />
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
          gap: '8px',
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
        }}
      >
        {saving ? (
          <>
            <Spinner size={13} />
            Saving
          </>
        ) : (
          'Save changes'
        )}
      </button>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          Last updated:
        </span>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          {formatLastUpdated(saved?.updatedAt)}
        </span>
      </div>
    </div>
  )
}
