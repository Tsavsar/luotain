'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/backbutton'
import SegmentedTabs from '@/components/segmentedtabs'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'
import { SHORT_DOMAIN, shortUrlFor } from '@/lib/shortlink'

// Nodes 136:2038 (empty) and 147:749 (filled) are the same screen —
// placeholder vs value, which a real input gives for free. So this is
// one component, not two.

const SLUG_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,48}[a-zA-Z0-9])?$/

const ADJECTIVES = [
  'swift',
  'quick',
  'clever',
  'bright',
  'calm',
  'bold',
  'keen',
  'brave',
  'quiet',
  'warm',
  'sharp',
  'gentle',
  'lucky',
  'noble',
  'plain',
  'proud',
]
const ANIMALS = [
  'otter',
  'fox',
  'crow',
  'heron',
  'lynx',
  'moth',
  'wren',
  'hare',
  'seal',
  'ibis',
  'stag',
  'mole',
  'newt',
  'owl',
  'pike',
  'toad',
]
function randomSlug() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const n = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${a}-${n}`
}

function LinkIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <path
        d='M8.5 11.5 11.5 8.5M7.2 9.1 5.9 10.4a2.9 2.9 0 0 0 4.1 4.1l1.3-1.3M12.8 10.9l1.3-1.3a2.9 2.9 0 0 0-4.1-4.1L8.7 6.8'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
      <path
        d='M7 8.5 10 11.5 13 8.5'
        stroke='var(--text-soft)'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// The regenerate affordance on the slug label (node 139:2479) — the real
// asset. Its #D1D1D1 is swapped for var(--bg-muted), which is that exact
// value in the token set, so it inverts properly in dark mode instead of
// staying a fixed light grey on a dark background.
function SparkleIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M9.59961 5.59961L10.5226 8.67657L13.5996 9.59961L10.5226 10.5226L9.59961 13.5996L8.67657 10.5226L5.59961 9.59961L8.67657 8.67657L9.59961 5.59961Z'
        fill='var(--bg-muted)'
        stroke='var(--bg-muted)'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M6.81065 3.81499L5.46609 3.30723L4.96137 1.95355C4.78633 1.48163 4.01297 1.48163 3.83793 1.95355L3.33321 3.30723L1.98865 3.81499C1.75505 3.90347 1.59961 4.12883 1.59961 4.38051C1.59961 4.63219 1.75505 4.85755 1.98865 4.94603L3.33321 5.45379L3.83793 6.80747C3.92545 7.04347 4.14961 7.19955 4.39961 7.19955C4.64961 7.19955 4.87385 7.04339 4.96129 6.80747L5.46601 5.45379L6.81057 4.94603C7.04417 4.85755 7.19961 4.63219 7.19961 4.38051C7.19961 4.12883 7.04425 3.90347 6.81065 3.81499Z'
        fill='var(--bg-muted)'
      />
    </svg>
  )
}

// ─── Field ───
// Local to this page on purpose. The design models this as a library
// component (its children carry instance ids), but the onboarding and
// new-org screens already have their own input treatment with the
// shake-on-error behaviour, and I can't see it from here. Building a
// second shared input would give you two competing ones. If you'd
// rather this used the existing component, say so and I'll swap it.
function Field({ label, hint, action, error, width, children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-start',
        width: width || '100%',
        minWidth: 0,
        flex: width ? '0 0 auto' : '1 0 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          paddingRight: action ? '4px' : 0,
        }}
      >
        <p
          className='label-xs'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {label}
        </p>
        {hint ? (
          <p
            className='para-xs'
            style={{ flex: '1 0 0', color: 'var(--bg-muted)', margin: 0 }}
          >
            {hint}
          </p>
        ) : null}
        {action}
      </div>

      {children}

      {/* Error sits under the field rather than replacing the label, so
          the field never changes height on validation — the whole form
          would otherwise jump on every failed submit. */}
      <p
        className='para-xs'
        aria-live='polite'
        style={{
          margin: 0,
          color: 'var(--error-base)',
          maxHeight: error ? '16px' : 0,
          opacity: error ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.2s ease, opacity 0.2s ease',
        }}
      >
        {error || ''}
      </p>
    </div>
  )
}

function inputShell(hasError) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    background: 'var(--bg-default)',
    // Design emits var(--radius-lg, 16px); this project's --radius-lg is
    // 12px and --radius-xl is 16px, so this matches the design's actual
    // radius. Figma's variable set and globals.css have drifted here.
    borderRadius: 'var(--radius-xl)',
    border: `1px solid ${hasError ? 'var(--error-base)' : 'var(--stroke-soft)'}`,
    boxShadow: '0px 2px 4px 0px rgba(54, 54, 54, 0.04)',
    padding: '10px 8px 10px 14px',
    transition: 'border-color 0.15s ease',
    boxSizing: 'border-box',
  }
}

const bareInput = {
  flex: '1 0 0',
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  lineHeight: '20px',
  letterSpacing: '0.28px',
}

export default function CreatePage() {
  const router = useRouter()
  const { useMockData } = useMockDataState()

  const [mode, setMode] = useState('link')
  const [destination, setDestination] = useState('')
  const [slug, setSlug] = useState('')
  const [domain, setDomain] = useState(SHORT_DOMAIN)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const destinationRef = useRef(null)

  useEffect(() => {
    destinationRef.current?.focus()
  }, [])

  const clearError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  function validate() {
    const next = {}
    if (!destination.trim()) {
      next.destination = 'Enter a destination URL'
    } else {
      const withScheme = /^https?:\/\//i.test(destination.trim())
        ? destination.trim()
        : `https://${destination.trim()}`
      try {
        const u = new URL(withScheme)
        if (!u.hostname.includes('.')) {
          next.destination = "That doesn't look like a valid URL"
        }
      } catch {
        next.destination = "That doesn't look like a valid URL"
      }
    }
    if (slug.trim() && !SLUG_PATTERN.test(slug.trim())) {
      next.slug = 'Use letters, numbers and hyphens only'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleCreate() {
    if (submitting) return
    if (!validate()) return

    if (mode === 'qr') {
      // QR creation needs the QrCode write path, which doesn't exist
      // yet — see the note in my message rather than a silent no-op.
      toast('QR creation is not wired up yet')
      return
    }

    setSubmitting(true)

    if (useMockData) {
      // No network with mock data on. Nothing persists here either:
      // the mock link pool is a fixed list, so a created link has
      // nowhere to live. Says so rather than pretending.
      const generated = slug.trim() || randomSlug()
      toast(`${shortUrlFor(generated)} created (mock, not saved)`)
      setSubmitting(false)
      router.push('/dashboard/links')
      return
    }

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          slug: slug.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        // The server names which field failed, so the error lands on
        // that field instead of in a toast the person has to map back
        // to an input themselves.
        if (data?.field) {
          setErrors({ [data.field]: data.error })
        } else {
          toast.error(data?.error || 'Something went wrong')
        }
        setSubmitting(false)
        return
      }

      toast(`${data.link.shortUrl} created`)
      // Straight to the new link's page — which is node 147:855, the
      // detail page with empty analytics. That state already exists;
      // it doesn't need building again.
      router.push(`/dashboard/links/${data.link.shortCode}`)
    } catch (err) {
      console.error('[CreatePage]', err)
      toast.error("Couldn't create the link")
      setSubmitting(false)
    }
  }

  return (
    <div
      className='dashboard-section dashboard-section-3 dashboard-page-padding'
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        // 0, not 36 — the layout's header section already carries 24px
        // of bottom padding, which is exactly the gap the design wants
        // between the logo row and Back. Adding more here would stack
        // the two into a 60px gap.
        paddingTop: 0,
        paddingBottom: '64px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <BackButton />
          <p
            className='para-md'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            What do you want to create?
          </p>
        </div>

        {/* Reusing the existing SegmentedTabs — it already renders as
            buttons with onChange when no href is given, and it brings
            the sliding indicator and reduced-motion handling with it. */}
        <SegmentedTabs
          items={[
            { id: 'link', label: 'Shorten a link' },
            { id: 'qr', label: 'Create a QR code' },
          ]}
          activeId={mode}
          onChange={setMode}
          padX='14px'
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field label='Destination' error={errors.destination}>
            <div style={inputShell(Boolean(errors.destination))}>
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <LinkIcon />
              </span>
              <input
                ref={destinationRef}
                type='url'
                inputMode='url'
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value)
                  clearError('destination')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
                placeholder='https://example.com/your-page'
                style={bareInput}
              />
            </div>
          </Field>

          <div
            style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
          >
            <Field label='Domain' width='170px'>
              <Dropdown
                fullWidth
                align='left'
                trigger={
                  <div style={inputShell(false)}>
                    <p
                      className='para-sm'
                      style={{
                        flex: '1 0 0',
                        minWidth: 0,
                        color: 'var(--text-strong)',
                        margin: 0,
                        textAlign: 'left',
                      }}
                    >
                      {domain}
                    </p>
                    <span style={{ display: 'flex', flexShrink: 0 }}>
                      <ChevronIcon />
                    </span>
                  </div>
                }
              >
                <DropdownMenu width='170px'>
                  <DropdownOption
                    selected={domain === SHORT_DOMAIN}
                    onClick={() => setDomain(SHORT_DOMAIN)}
                  >
                    {SHORT_DOMAIN}
                  </DropdownOption>
                </DropdownMenu>
              </Dropdown>
            </Field>

            <Field
              label='Slug'
              hint='(Optional)'
              error={errors.slug}
              action={
                <button
                  type='button'
                  onClick={() => {
                    setSlug(randomSlug())
                    clearError('slug')
                  }}
                  title='Generate slug'
                  aria-label='Generate slug'
                  className='slug-regen'
                  style={{
                    display: 'flex',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <SparkleIcon />
                </button>
              }
            >
              <div style={inputShell(Boolean(errors.slug))}>
                <input
                  type='text'
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    clearError('slug')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                  }}
                  placeholder='swift-otter'
                  autoCapitalize='none'
                  autoCorrect='off'
                  spellCheck='false'
                  style={bareInput}
                />
              </div>
            </Field>
          </div>

          <p
            className='para-xs'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            Leave the slug blank and we&rsquo;ll generate one. Only verified
            domains show up here,{' '}
            <button
              type='button'
              onClick={() => {
                // TODO: no domains screen exists yet.
                toast('Domain management is not built yet')
              }}
              className='label-xs'
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--text-strong)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              manage domains
            </button>
            .
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type='button'
            onClick={handleCreate}
            disabled={submitting}
            className='create-submit'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--text-strong)',
              border: 'none',
              cursor: submitting ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0.28px',
              color: 'var(--bg-default)',
            }}
          >
            {submitting
              ? 'Creating…'
              : mode === 'qr'
                ? 'Create QR code'
                : 'Create link'}
          </button>
        </div>
      </div>
    </div>
  )
}
