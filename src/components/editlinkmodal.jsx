'use client'

import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/modal'
import Inputfield from '@/components/input'
import { toast } from '@/components/toast'

// ─── Edit link ───
// Destination, title and slug.
//
// A modal rather than a page: editing is a small correction made from the table
// you were already looking at, and a route change would lose your scroll
// position and filters to change one field.

// Local, because FieldLabel lives inside the create page rather than being a
// shared component. Importing across into a route file would couple this modal
// to that page's internals; a five-line label is cheaper than that.
function Field({ label, children }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}
    >
      <span className='para-xs' style={{ color: 'var(--text-sub)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function LinkIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M8.5 11.5a3.2 3.2 0 0 0 4.8.35l2-2a3.2 3.2 0 0 0-4.5-4.5l-1.1 1.1M11.5 8.5a3.2 3.2 0 0 0-4.8-.35l-2 2a3.2 3.2 0 0 0 4.5 4.5l1.1-1.1'
        stroke='currentColor'
        strokeWidth='1.5'
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

export default function EditLinkModal({
  open,
  link,
  onClose,
  onSaved,
  origin,
}) {
  const [destination, setDestination] = useState('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [shaking, setShaking] = useState({})
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Reset every time it opens. Without this, editing one link then another
  // shows the first one's values until you notice.
  useEffect(() => {
    if (!open || !link) return
    setDestination(link.destinationUrl || link.destination || '')
    setTitle(link.title || '')
    setSlug(link.shortCode || link.slug || '')
    setErrors({})
  }, [open, link])

  function flag(fields) {
    setErrors(fields)
    setShaking(fields)
    timers.current.push(setTimeout(() => setShaking({}), 320))
    timers.current.push(setTimeout(() => setErrors({}), 2000))
  }

  const dirty =
    Boolean(link) &&
    (destination !== (link.destinationUrl || link.destination || '') ||
      title !== (link.title || '') ||
      slug !== (link.shortCode || link.slug || ''))

  async function handleSave() {
    if (!dirty || saving) return
    if (!destination.trim()) {
      flag({ destinationUrl: true })
      toast.error('Enter a destination')
      return
    }

    setSaving(true)
    try {
      // Only what changed. Sending the slug unchanged would make every edit
      // look like a slug change to the plan check and 402 for free users
      // editing a destination.
      const patch = {}
      if (destination !== (link.destinationUrl || link.destination || '')) {
        patch.destinationUrl = destination.trim()
      }
      if (title !== (link.title || '')) patch.title = title.trim()
      if (slug !== (link.shortCode || link.slug || '')) patch.slug = slug.trim()

      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const d = await res.json().catch(() => null)

      if (!res.ok) {
        if (d?.field) flag({ [d.field]: true })
        toast.error(d?.error || `Couldn't save (${res.status})`)
        return
      }

      toast('Link updated')
      onSaved?.(d.link)
      onClose?.()
    } catch (err) {
      console.error('[EditLink]', err)
      toast.error("Couldn't save the link")
    } finally {
      setSaving(false)
    }
  }

  if (!link) return null

  const slugChanged = slug !== (link.shortCode || link.slug || '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy='edit-link-title'
      origin={origin}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '360px',
          maxWidth: '100%',
        }}
      >
        <p
          id='edit-link-title'
          className='label-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          Edit link
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label='Destination'>
            <Inputfield
              lefticon={<LinkIcon />}
              placeholder='https://example.com/page'
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              error={Boolean(errors.destinationUrl)}
              shaking={Boolean(shaking.destinationUrl)}
            />
          </Field>

          <Field label='Title'>
            <Inputfield
              placeholder='Optional'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </Field>

          <Field label='Short link'>
            <Inputfield
              placeholder='swift-otter'
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              error={Boolean(errors.slug)}
              shaking={Boolean(shaking.slug)}
            />
          </Field>

          {/* Only when they've actually changed it. A permanent warning about
              something that hasn't happened is noise, and people stop reading
              warnings that are always there. */}
          {slugChanged ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                lineHeight: 1.5,
                letterSpacing: '0.2px',
                color: 'var(--error-base)',
              }}
            >
              The old short link stops working straight away. Anything already
              printed or shared with it will break.
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <button
            type='button'
            onClick={onClose}
            disabled={saving}
            className='discard-changes'
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: saving ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.24px',
              color: 'var(--text-soft)',
            }}
          >
            Cancel
          </button>

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
              borderRadius: 'var(--radius-full)',
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
            {saving ? <Spinner /> : null}
            {saving ? 'Saving' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
