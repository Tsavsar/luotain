'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/backbutton'
import Inputfield from '@/components/input'
import Tooltip from '@/components/tooltip'
import QrDesigner from '@/components/qrdesigner'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'
import { getMockLinksTable } from '@/lib/mockAnalytics'
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
// The destination field's icon. #D1D1D1 in the asset is swapped for
// currentColor so it follows Inputfield's own icon logic — soft when the field
// is empty, strong once there's a value — which a fixed grey would ignore.
function LinkIcon() {
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
        d='M10 17C8.6193 17 7.5 13.866 7.5 10C7.5 6.134 8.6193 3 10 3C11.1019 3 12.0373 4.9961 12.3701 7.7674'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M10 17C6.134 17 3 13.866 3 10C3 6.134 6.134 3 10 3C13.6244 3 16.6054 5.7545 16.9639 9.2843'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3 10H8.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M11.5 11L17.5 13L14.5 14L13.5 17L11.5 11Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='2'
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
  const { useMockData, ready: mockReady, deletedUrls } = useMockDataState()

  // Fixed. The mode selector is gone — this page only creates links now, and a
  // QR comes with each one. Kept as a constant rather than ripped out of every
  // branch below, so the QR design step stays reachable from the link page
  // without a rewrite of the whole file.
  const mode = 'link'
  // QR mode has two sources: a link that already exists, or a new one created
  // alongside the code. Before this, the only way to get a QR for an existing
  // link was to navigate to that link's detail page and use the field there —
  // which meant the create screen couldn't do the more common of the two jobs.
  const [qrSource, setQrSource] = useState('existing')
  const [existingLinks, setExistingLinks] = useState(null)
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  // QR creation is two steps: the destination details, then the design.
  // Links are one step, so this only ever leaves 'details' in QR mode.
  const [step, setStep] = useState('details')
  const [qr, setQr] = useState({
    color: '#000000',
    markerColor: '#000000',
    pattern: 'square',
    branding: true,
  })
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

  // Resolved from the list rather than stored alongside the id, so it can't go
  // stale if the list reloads.
  const selectedLink =
    existingLinks?.find((l) => l.id === selectedLinkId) || null

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

    if (mode === 'qr' && qrSource !== 'new') {
      // Pointing at an existing link, so there's no destination, domain or slug
      // to validate — only whether one was picked.
      if (!selectedLinkId) {
        flagError({ destination: true })
        toast.error('Choose a link, or create a new one')
        return
      }
      setStep('design')
      return
    }

    if (mode === 'qr' && step === 'details') {
      // Details are valid, so move to the design step rather than
      // submitting — the code can't be created before it's styled.
      setStep('design')
      return
    }

    if (mode === 'qr' && step === 'design') {
      // An existing link is the only path that can actually save right now: the
      // endpoint attaches a code to a link that already exists. Creating a link
      // AND a code together needs two writes in sequence, which is a bigger
      // change than this — so that path says so rather than half-doing it.
      if (qrSource !== 'existing' || !selectedLinkId) {
        toast('Creating a link and code together is not built yet')
        return
      }

      setSubmitting(true)

      if (useMockData) {
        setSubmitting(false)
        toast(`QR code created for ${selectedLink?.shortUrl} (mock, not saved)`)
        return
      }

      try {
        const res = await fetch('/api/qrcodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkId: selectedLinkId, ...qr }),
        })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          console.error('[CreatePage] qr create failed', res.status, data)
          toast.error(
            data?.error || `Couldn't create the QR code (${res.status})`
          )
          setSubmitting(false)
          return
        }

        toast('QR code created')
        router.push('/dashboard/qrcodes')
      } catch (err) {
        console.error('[CreatePage]', err)
        toast.error("Couldn't create the QR code")
        setSubmitting(false)
      }
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
        // 402 is a billing limit, not a validation error. Worth separating:
        // shaking the slug field for "custom slugs are a Pro feature" would
        // suggest the slug is malformed, when the problem is the plan.
        if (res.status === 402) {
          if (data?.field) flagError({ [data.field]: true })
          toast.error(data.error)
          setSubmitting(false)
          return
        }
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
          {/* Hidden on the design step — its Back lives in the footer
              beside Create code, where step navigation belongs. Two
              Backs doing the same thing is noise, and two Backs doing
              DIFFERENT things (one step, one exit) risks someone losing
              a typed destination to a mis-click. */}
          {mode === 'qr' && step === 'design' ? null : <BackButton />}
          <p
            className='para-md'
            style={{ color: 'var(--text-strong)', margin: 0 }}
          >
            {mode === 'qr' && step === 'design'
              ? 'Design your QR code'
              : 'What do you want to create?'}
          </p>
        </div>

        {mode === 'qr' && step === 'design' ? (
          <QrDesigner
            color={qr.color}
            markerColor={qr.markerColor}
            pattern={qr.pattern}
            branding={qr.branding}
            // For an existing link, the link's own URL. The QR gets its own
            // slug, but the server generates that on save, so there's nothing
            // truthful to show for it yet — and the link's URL is what the code
            // will ultimately resolve to either way.
            //
            // For a new link, only once there's a slug: a blank one would read
            // "luot.link/" and the copy button would hand over a dead link.
            shortUrl={
              qrSource === 'existing'
                ? selectedLink?.shortUrl || null
                : slug.trim()
                  ? `${domain}/${slug.trim()}`
                  : null
            }
            onChange={setQr}
          />
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {mode === 'qr' ? (
              <FieldLabel label='Link'>
                <Dropdown
                  fullWidth
                  align='left'
                  trigger={
                    // Inputfield as the trigger, matching the domain picker
                    // below — a second control that only looked similar would
                    // read as a different kind of field.
                    <Inputfield
                      lefticon={<LinkIcon />}
                      righticon={<ChevronIcon />}
                      placeholder={
                        existingLinks === null
                          ? 'Loading your links…'
                          : existingLinks.length === 0
                            ? 'No links yet — create one first'
                            : 'Choose a link'
                      }
                      value={
                        qrSource === 'new'
                          ? 'A new link'
                          : selectedLink
                            ? selectedLink.shortUrl
                            : ''
                      }
                      onChange={() => {}}
                      error={Boolean(errors.destination)}
                      shaking={Boolean(shaking.destination)}
                    />
                  }
                >
                  <DropdownMenu width='440px'>
                    {existingLinks === null ? (
                      // Plain text, not a DropdownOption — it has no disabled
                      // state, and a clickable-looking row that does nothing is
                      // worse than one that clearly isn't a choice.
                      <p
                        className='para-xs'
                        style={{
                          color: 'var(--text-soft)',
                          margin: 0,
                          padding: '8px 10px',
                        }}
                      >
                        Loading your links…
                      </p>
                    ) : existingLinks.length === 0 ? (
                      <p
                        className='para-xs'
                        style={{
                          color: 'var(--text-soft)',
                          margin: 0,
                          padding: '8px 10px',
                        }}
                      >
                        No links yet — create one below
                      </p>
                    ) : (
                      existingLinks.map((l) => (
                        <DropdownOption
                          key={l.id}
                          selected={l.id === selectedLinkId}
                          onClick={() => {
                            setSelectedLinkId(l.id)
                            // Back out of new-link mode, which hides the
                            // destination and slug fields again.
                            setQrSource('existing')
                            clearError('destination')
                          }}
                        >
                          {l.shortUrl}
                        </DropdownOption>
                      ))
                    )}

                    {/* The second path, as an option rather than a toggle above
                        the field. This replaced an Existing link / New link
                        segmented control — which was a whole extra control to
                        answer a question the dropdown was already asking. */}
                    <div
                      aria-hidden='true'
                      style={{
                        height: '1px',
                        margin: '4px 6px',
                        background: 'var(--stroke-soft)',
                      }}
                    />
                    <DropdownOption
                      selected={qrSource === 'new'}
                      onClick={() => {
                        setQrSource('new')
                        setSelectedLinkId(null)
                        clearError('destination')
                      }}
                    >
                      Create a new link
                    </DropdownOption>
                  </DropdownMenu>
                </Dropdown>
              </FieldLabel>
            ) : null}

            {/* Shown for a plain link, and for a QR pointed at a new one — those
                aren't alternatives, since a new link needs a destination either
                way. It used to be an either/or with the picker above, which meant
                choosing "new link" left nowhere to type the URL. */}
            {mode !== 'qr' || qrSource === 'new' ? (
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
            ) : null}

            {/* Hidden when pointing at an existing link: it already has a
                domain and a slug, and offering to set them again would imply
                the code could change them. It can't — the QR gets its own slug
                from the server. */}
            <div
              style={{
                display:
                  mode === 'qr' && qrSource === 'existing' ? 'none' : 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}
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

            {/* Describes the domain and slug fields, so it's hidden with them.
                It sat outside that row before, which meant it appeared under the
                link picker and offered slug advice for a link that already has
                one. */}
            <p
              className='para-xs'
              style={{
                color: 'var(--text-soft)',
                margin: 0,
                display: mode === 'qr' && qrSource !== 'new' ? 'none' : 'block',
              }}
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
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            // space-between once there are two controls, so Back sits
            // left and the primary action stays right.
            justifyContent:
              mode === 'qr' && step === 'design' ? 'space-between' : 'flex-end',
            width: '100%',
          }}
        >
          {mode === 'qr' && step === 'design' ? (
            <button
              type='button'
              onClick={() => setStep('details')}
              className='create-secondary'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                // bg-surface grey, no border, no shadow — node 149:977.
                background: 'var(--bg-surface)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0.28px',
                color: 'var(--bg-weak)',
              }}
            >
              Back
            </button>
          ) : null}

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
              : mode === 'link'
                ? 'Create link'
                : step === 'details'
                  ? 'Design QR code'
                  : 'Create code'}
          </button>
        </div>
      </div>
    </div>
  )
}
