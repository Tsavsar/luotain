'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/backbutton'
import SegmentedTabs from '@/components/segmentedtabs'
import Inputfield from '@/components/input'
import Tooltip from '@/components/tooltip'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'
import { SHORT_DOMAIN } from '@/lib/shortlink'
import { getMockDomains } from '@/lib/mockAnalytics'

// Nodes 136:2038 (empty) and 147:749 (filled) are the same screen —
// placeholder vs value, which a real input gives for free. So this is
// one component, not two.
//
// Inputs are the project's own Inputfield, which brings the focus and
// hover borders, the shadow tokens, and the shake with it. Its error
// signal is a red border plus a shake rather than error text, so that's
// the pattern used here — matching the auth and onboarding screens
// instead of inventing a second one.

const SLUG_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,48}[a-zA-Z0-9])?$/

// Shake is brief; the red border outlives it on its own timer, so
// there's still something to look at once the motion has finished —
// and so anyone with reduced motion enabled (which strips the shake
// entirely) still gets a signal. Same split as the auth pages.
const SHAKE_MS = 320
const ERROR_MS = 2000
// Half the slug swap: blur out, replace the value while it's unreadable,
// blur back in. Short enough not to feel like waiting.
const SWAP_MS = 130

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

// The real asset. Its #e8e8e8 is swapped for currentColor so it picks up
// Inputfield's own icon colour logic — that wrapper already shifts from
// --text-soft to --text-strong on focus or once the field has a value,
// and a hardcoded fill would sit there ignoring it.
function LinkIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='20'
      height='20'
      viewBox='0 0 20 20'
      aria-hidden='true'
    >
      <g fill='currentColor'>
        <path
          d='m11,6l-1.9645-1.9645c-1.3807-1.3807-3.6193-1.3807-5,0h0c-1.3807,1.3807-1.3807,3.6193,0,5l1.9645,1.9645'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <path
          d='m9,14l1.9645,1.9645c1.3807,1.3807,3.6193,1.3807,5,0h0c1.3807-1.3807,1.3807-3.6193,0-5l-1.9645-1.9645'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
        <line
          x1='12'
          y1='12'
          x2='8'
          y2='8'
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
        />
      </g>
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

// Node 139:2479. Painted with currentColor rather than a fixed fill, so
// the hover state in globals.css can take it orange — an inline fill
// can't be reached by a :hover rule. Resting colour is --bg-muted,
// which is the #D1D1D1 the asset ships with.
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
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M6.81065 3.81499L5.46609 3.30723L4.96137 1.95355C4.78633 1.48163 4.01297 1.48163 3.83793 1.95355L3.33321 3.30723L1.98865 3.81499C1.75505 3.90347 1.59961 4.12883 1.59961 4.38051C1.59961 4.63219 1.75505 4.85755 1.98865 4.94603L3.33321 5.45379L3.83793 6.80747C3.92545 7.04347 4.14961 7.19955 4.39961 7.19955C4.64961 7.19955 4.87385 7.04339 4.96129 6.80747L5.46601 5.45379L6.81057 4.94603C7.04417 4.85755 7.19961 4.63219 7.19961 4.38051C7.19961 4.12883 7.04425 3.90347 6.81065 3.81499Z'
        fill='currentColor'
      />
    </svg>
  )
}

// Label scaffolding only — Inputfield takes no label, so the auth pages
// place theirs externally too. This is that, not a second input.
function FieldLabel({ label, hint, action, width, children }) {
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
    </div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const { useMockData } = useMockDataState()

  const [mode, setMode] = useState('link')
  const [destination, setDestination] = useState('')
  const [slug, setSlug] = useState('')
  const [domain, setDomain] = useState(SHORT_DOMAIN)
  // Verified only — the helper text under the form promises exactly
  // that, so the picker has to honour it rather than list everything.
  const domains = getMockDomains()
  const [errors, setErrors] = useState({})
  const [shaking, setShaking] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [swappingSlug, setSwappingSlug] = useState(false)
  const timers = useRef([])
  const swapTimer = useRef(null)

  // Any pending shake/error timer has to be dropped on unmount, or it
  // fires setState on a component that's gone — which is easy to hit
  // here since a successful create navigates away immediately.
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      clearTimeout(swapTimer.current)
    }
  }, [])

  function regenerateSlug() {
    // With reduced motion the blur transition is collapsed to nothing by
    // the global rule, so waiting SWAP_MS would just be dead time with
    // no visual — the value changes immediately instead.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    clearError('slug')
    if (reduced) {
      setSlug(randomSlug())
      return
    }

    // Restarts rather than ignoring a second click mid-swap: the blur
    // just holds and a new slug lands, which stays responsive instead of
    // swallowing the tap.
    clearTimeout(swapTimer.current)
    setSwappingSlug(true)
    swapTimer.current = setTimeout(() => {
      setSlug(randomSlug())
      setSwappingSlug(false)
    }, SWAP_MS)
  }

  const flagError = useCallback((fields) => {
    setErrors(fields)
    setShaking(fields)
    timers.current.push(setTimeout(() => setShaking({}), SHAKE_MS))
    timers.current.push(setTimeout(() => setErrors({}), ERROR_MS))
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
    const bad = {}
    if (!destination.trim()) {
      bad.destination = true
    } else {
      const withScheme = /^https?:\/\//i.test(destination.trim())
        ? destination.trim()
        : `https://${destination.trim()}`
      try {
        const u = new URL(withScheme)
        if (!u.hostname.includes('.')) bad.destination = true
      } catch {
        bad.destination = true
      }
    }
    if (slug.trim() && !SLUG_PATTERN.test(slug.trim())) bad.slug = true

    if (Object.keys(bad).length > 0) {
      flagError(bad)
      // The border and shake carry the "which field" part; the toast
      // carries the "why", since Inputfield has nowhere to put a
      // message.
      toast.error(
        bad.destination
          ? 'Enter a valid destination URL'
          : 'Slugs can use letters, numbers and hyphens only'
      )
      return false
    }
    return true
  }

  async function handleCreate() {
    if (submitting) return
    if (!validate()) return

    if (mode === 'qr') {
      // QR creation needs the QrCode write path, which doesn't exist yet.
      toast('QR design is not wired up yet')
      return
    }

    setSubmitting(true)

    if (useMockData) {
      // No network with mock data on, and nothing persists: the mock
      // link pool is a fixed list, so a created link has nowhere to
      // live. Says so rather than pretending.
      const generated = slug.trim() || randomSlug()
      toast(`${domain}/${generated} created (mock, not saved)`)
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
          domain,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        // The server names which field failed, so the shake and border
        // land on that field rather than the person having to work out
        // which input the message refers to.
        if (data?.field) flagError({ [data.field]: true })
        toast.error(data?.error || 'Something went wrong')
        setSubmitting(false)
        return
      }

      toast(`${data.link.shortUrl} created`)
      // Straight to the new link's page — node 147:855 is that page with
      // empty analytics, which already exists.
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
        // of bottom padding, which is the gap the design wants between
        // the logo row and Back. More here would stack them.
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
          <FieldLabel label='Destination'>
            <Inputfield
              lefticon={<LinkIcon />}
              placeholder='https://example.com/your-page'
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                clearError('destination')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
              }}
              error={Boolean(errors.destination)}
              shaking={Boolean(shaking.destination)}
            />
          </FieldLabel>

          <div
            style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
          >
            <FieldLabel label='Domain' width='170px'>
              <Dropdown
                fullWidth
                align='left'
                trigger={
                  // Inputfield as the trigger so the domain matches the
                  // other two exactly rather than a second control that
                  // only looks similar. onChange is a no-op: it's a
                  // picker, and a controlled input whose value never
                  // changes is read-only in practice.
                  <Inputfield
                    value={domain}
                    onChange={() => {}}
                    righticon={<ChevronIcon />}
                  />
                }
              >
                <DropdownMenu width='220px'>
                  {domains.map((d) => (
                    <DropdownOption
                      key={d.hostname}
                      selected={domain === d.hostname}
                      onClick={() => setDomain(d.hostname)}
                    >
                      {d.hostname}
                    </DropdownOption>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </FieldLabel>

            <FieldLabel
              label='Slug'
              hint='(Optional)'
              action={
                <Tooltip label='Generate slug'>
                  <button
                    type='button'
                    onClick={regenerateSlug}
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
                </Tooltip>
              }
            >
              <Inputfield
                placeholder='swift-otter'
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  clearError('slug')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
                error={Boolean(errors.slug)}
                shaking={Boolean(shaking.slug)}
                swapping={swappingSlug}
              />
            </FieldLabel>
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
                ? 'Design QR code'
                : 'Create link'}
          </button>
        </div>
      </div>
    </div>
  )
}
