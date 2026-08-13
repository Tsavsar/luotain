'use client'

import { useEffect, useRef, useState } from 'react'
import AvatarRow from '@/components/avatarrow'
import SaveBar from '@/components/savebar'
import { SettingsGeneralSkeleton } from '@/components/settingsskeleton'
import { useUnsavedChanges, UnsavedBanner } from '@/components/unsavedchanges'
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

  // Same guard as the account page: warns on tab close AND on in-app
  // navigation, which beforeunload can't see.
  const { warnOpen, warnShaking } = useUnsavedChanges(
    dirty,
    '/dashboard/settings/organization'
  )

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

      // Tells the header, which fetched the name once on mount and would
      // otherwise show the old one until a reload.
      window.dispatchEvent(
        new CustomEvent('luotain:org-updated', {
          detail: {
            name: next.name,
            // Sent even when null — removing the picture has to clear it in the
            // header too, and omitting the key would leave the old one there.
            image: next.image,
            avatarSeed: next.avatarSeed,
          },
        })
      )

      toast('Workspace updated')
    } catch (err) {
      console.error('[OrgSettings]', err)
      toast.error("Couldn't save the workspace")
    } finally {
      setSaving(false)
    }
  }

  // The same skeleton the account page uses. The hand-rolled one here had a
  // full-width avatar bar above a 360px field, so the layout jumped as the real
  // content replaced it — which is the exact mismatch the wrapper below fixes.
  if (!draft) return <SettingsGeneralSkeleton />

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

      <UnsavedBanner
        open={warnOpen}
        shaking={warnShaking}
        onDiscard={() => setDraft(saved)}
        disabled={saving}
      />

      {/* The same wrapper the account page uses, so the avatar row and the name
          field share one width. It was a bare 100% here, which stretched the row
          across the full column while the field below stayed at 360. */}
      <div
        className='settings-field-group'
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-start',
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

        {/* No width of its own: the parent above carries the cap, and nesting
            the same class would apply it twice for no effect. */}
        <div style={{ width: '100%' }}>
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
          {formatLastUpdated(saved?.updatedAt)}
        </span>
      </div>
    </div>
  )
}
