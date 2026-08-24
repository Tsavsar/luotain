'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Inputfield from '@/components/input'
import Tag from '@/components/tag'
import Tooltip from '@/components/tooltip'
import CopyButton from '@/components/copybutton'
import { CopyIcon, MoreIcon } from '@/components/linktablehelpers'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import { toast } from '@/components/toast'
import { useMockDataState } from '@/components/mockdatacontext'
import { PLANS } from '@/lib/plans'

// ─── Organisation → Domains ───
// Nodes 106:1554 (paywalled), 108:1543 (pending with DNS) and 108:1809 (the
// verified table).
//
// One page. Which state you see is decided by the plan and by what's been
// added, not by a route.

function GlobeIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='10' cy='10' r='7.2' stroke='currentColor' strokeWidth='1.4' />
      <path
        d='M2.8 10h14.4M10 2.8c1.9 2 2.9 4.5 2.9 7.2s-1 5.2-2.9 7.2c-1.9-2-2.9-4.5-2.9-7.2S8.1 4.8 10 2.8Z'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3 8h9M8.5 4l4 4-4 4'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 14 14'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M12 7a5 5 0 1 1-1.6-3.7M12 2v2.6H9.4'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='9' cy='9' r='6.8' stroke='currentColor' strokeWidth='1.4' />
      <path
        d='M7.1 7a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.7.6-.7 1.1v.3'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
      />
      <circle cx='9' cy='12.4' r='0.85' fill='currentColor' />
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

const COL_HOST = '158px'

// An icon on the same raised plate as the status tag beside it, so the pair
// reads as one control group rather than a tag with a loose button next to it.
function TagButton({ onClick, label, busy, children }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      className='domain-recheck'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-default)',
        border: '1px solid var(--stroke-soft)',
        boxShadow: '0 2px 2px rgba(54, 54, 54, 0.04)',
        cursor: busy ? 'default' : 'pointer',
        color: 'var(--text-sub)',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// Note: the status itself is derived in GET /api/org/domains, not here. It
// depends on how the verify route recorded the result, so the two belong
// together rather than split across the network.

// ─── The DNS instructions ───
function DnsRecord({ label, value, copyable }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <p
        className='para-xs'
        style={{
          color: 'var(--text-soft)',
          margin: 0,
          width: '74px',
          flexShrink: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '20px',
          letterSpacing: '0.28px',
          color: 'var(--text-strong)',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </p>
      {/* Only the value is copyable. "CNAME" and a subdomain are typed in a
          second; the target is the string that has to be exact. */}
      {copyable ? (
        <CopyButton
          value={value}
          icon={<CopyIcon />}
          label='Copy value'
          toastMessage='Copied to clipboard'
          style={{ flexShrink: 0 }}
        />
      ) : null}
    </div>
  )
}

const VERIFIED = [
  {
    id: 'd1',
    hostname: 'links.studio.co',
    dns: { type: 'CNAME', host: 'links', value: 'cname.vercel-dns.com' },
    verified: true,
    status: 'verified',
    links: 12,
    clicks: 40,
  },
  {
    id: 'd2',
    hostname: 'go.acme.com',
    dns: { type: 'CNAME', host: 'go', value: 'cname.vercel-dns.com' },
    verified: true,
    status: 'verified',
    links: 5,
    clicks: 21,
  },
]

// The two failures worth telling apart: a record that exists but points
// somewhere else, and a hostname that doesn't resolve at all.
const WRONG_TARGET = {
  status: 'failed',
  id: 'd4',
  hostname: 'links.wrongtarget.co',
  dns: { type: 'CNAME', host: 'links', value: 'cname.vercel-dns.com' },
  verified: false,
  links: 0,
  clicks: 0,
  lastError: 'Found a CNAME pointing at ghs.googlehosted.com instead',
}

const TYPO = {
  status: 'failed',
  id: 'd5',
  hostname: 'go.acmee.com',
  dns: { type: 'CNAME', host: 'go', value: 'cname.vercel-dns.com' },
  verified: false,
  links: 0,
  clicks: 0,
  lastError: "That hostname doesn't resolve — check it's spelt right",
}

// Waiting on DNS. lastError is null rather than a message, because a domain
// added a minute ago hasn't failed — it just hasn't been checked, and saying
// otherwise reports a result that never happened.
const WAITING = {
  id: 'd3',
  hostname: 'try.acme.com',
  dns: { type: 'CNAME', host: 'try', value: 'cname.vercel-dns.com' },
  verified: false,
  status: 'pending',
  links: 0,
  clicks: 0,
  lastError: null,
}

// Just added, never checked. The step between pressing Add and pressing Save —
// the one I kept collapsing into the others.
const DRAFT = {
  id: 'd0',
  hostname: 'acme.com',
  dns: { type: 'A', host: '@', value: '76.76.21.21', isApex: true },
  verified: false,
  status: 'draft',
  links: 0,
  clicks: 0,
  lastError: null,
}

function mockDomainsFor(state) {
  if (state === 'empty') return []
  if (state === 'draft') return [DRAFT]
  if (state === 'pending') return [WAITING]
  if (state === 'failed') return [WRONG_TARGET, TYPO]
  if (state === 'verified') return VERIFIED
  return [...VERIFIED, DRAFT, WAITING, WRONG_TARGET, TYPO]
}

export default function DomainsPage() {
  const router = useRouter()
  const {
    useMockData,
    mockPlan,
    mockDomainState,
    ready: mockReady,
  } = useMockDataState()
  const [data, setData] = useState(null)
  const [hostname, setHostname] = useState('')
  const [adding, setAdding] = useState(false)
  const [checking, setChecking] = useState(null)
  // Only used by the DRAFT stage, where the hostname is still editable. Once
  // saved it's committed and the row becomes text.
  const [drafts, setDrafts] = useState({})
  const [errored, setErrored] = useState(false)
  const [shaking, setShaking] = useState(false)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function load() {
    return fetch('/api/org/domains')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => d && setData(d))
      .catch((err) => console.error('[Domains]', err))
  }

  useEffect(() => {
    if (!mockReady) return

    if (useMockData) {
      const plan = PLANS[mockPlan] || PLANS.FREE
      setData({
        allowed: Boolean(plan.customDomain),
        planName: plan.name,
        role: 'OWNER',
        cnameTarget: 'cname.luotain.app',
        // Both states at once on Pro — a verified pair and one still pending —
        // since the page's whole job is showing the difference.
        // Built from the chosen scenario rather than a fixed list — see the
        // Domains row in the dev panel. The messages are the exact strings the
        // verify endpoint produces, tested against live DNS, so what renders
        // here is what a real check would say.
        domains: plan.customDomain ? mockDomainsFor(mockDomainState) : [],
      })
      return
    }

    load()
  }, [mockReady, useMockData, mockPlan, mockDomainState])

  function flag() {
    setErrored(true)
    setShaking(true)
    timers.current.push(setTimeout(() => setShaking(false), 320))
    timers.current.push(setTimeout(() => setErrored(false), 2000))
  }

  async function handleAdd() {
    const value = hostname.trim()
    if (!value) {
      flag()
      toast.error('Enter a domain')
      return
    }
    if (useMockData) {
      toast('Mock data is on — nothing was added')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/org/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: value }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        if (d?.field) flag()
        toast.error(d?.error || `Couldn't add the domain (${res.status})`)
        return
      }
      setHostname('')
      toast(`${d.domain.hostname} added`)
      await load()
    } catch (err) {
      console.error('[Domains]', err)
      toast.error("Couldn't add the domain")
    } finally {
      setAdding(false)
    }
  }

  // Just a check now. The rename path went with the editable field — a
  // different hostname is a different domain, so it's remove-and-re-add.
  async function handleCheck(domain) {
    if (useMockData) {
      toast('Mock data is on — nothing was checked')
      return
    }
    setChecking(domain.id)
    try {
      // The edited hostname goes with it only from the draft stage. A
      // committed domain sends nothing, so a re-check can't quietly rename it.
      const edited =
        domain.status === 'draft'
          ? (drafts[domain.id] ?? domain.hostname).trim()
          : null

      const res = await fetch(`/api/org/domains/${domain.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edited ? { hostname: edited } : {}),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(d?.error || "Couldn't check the domain")
        return
      }
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[domain.id]
        return next
      })

      toast(
        d.domain.verified
          ? `${d.domain.hostname} is verified`
          : d.domain.lastError || 'Still waiting on DNS'
      )
      await load()
    } catch (err) {
      console.error('[Domains]', err)
      toast.error("Couldn't check the domain")
    } finally {
      setChecking(null)
    }
  }

  async function handleRemove(domain) {
    if (useMockData) {
      toast('Mock data is on — nothing was removed')
      return
    }
    try {
      const res = await fetch(`/api/org/domains/${domain.id}`, {
        method: 'DELETE',
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(d?.error || "Couldn't remove the domain")
        return
      }
      toast(`${domain.hostname} removed`)
      await load()
    } catch (err) {
      console.error('[Domains]', err)
      toast.error("Couldn't remove the domain")
    }
  }

  if (!data) {
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
            width: '76px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        <div
          className='skeleton-pulse'
          style={{
            width: '100%',
            height: '92px',
            borderRadius: '24px',
            background: 'var(--bg-surface)',
          }}
        />
      </div>
    )
  }

  const canManage = data.role === 'OWNER' || data.role === 'ADMIN'
  // The platform domain is excluded from both lists. It's available to
  // everyone and removable by nobody, so listing it under "your domains" with
  // a Remove option would offer something that can't happen.
  const owned = data.domains.filter((d) => !d.shared)
  const pending = owned.filter((d) => !d.verified)
  const verified = owned.filter((d) => d.verified)

  const header = (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0, flex: '1 0 0' }}
      >
        Domains
      </p>
      {/* Explains what a custom domain IS before someone has one — the page is
          otherwise a form with no context for anyone who arrived by browsing
          the settings nav. */}
      <Tooltip
        label='Use your own domain for short links and QR codes, like go.yourbrand.com'
        placement='left'
      >
        <span
          style={{ display: 'flex', color: 'var(--text-soft)', flexShrink: 0 }}
        >
          <HelpIcon />
        </span>
      </Tooltip>
    </div>
  )

  // ─── Paywalled ───
  if (!data.allowed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
        }}
      >
        {header}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '14px 22px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-surface)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: '1 0 0',
              minWidth: 0,
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '20px',
                  letterSpacing: '0.28px',
                  color: 'var(--text-strong)',
                }}
              >
                Custom domains are a Pro feature
              </p>
              <p
                className='para-xs'
                style={{ color: 'var(--text-sub)', margin: 0 }}
              >
                Connect a domain like go.yourbrand.com so every link and QR code
                carries your own name instead of luot.link. Upgrade to Pro to
                set one up.
              </p>
            </div>

            <button
              type='button'
              onClick={() => router.push('/dashboard/settings/billing')}
              className='billing-action'
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
                color: 'var(--text-strong)',
                // Dotted underline per the design — it reads as a link without
                // borrowing the solid underline used for real hyperlinks.
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationColor: 'var(--text-soft)',
                textUnderlineOffset: '3px',
              }}
            >
              Upgrade to pro
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Allowed ───
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
        }}
      >
        {header}

        {canManage ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div className='settings-field-group'>
              <Inputfield
                lefticon={<GlobeIcon />}
                placeholder='go.yourbrand.com'
                value={hostname}
                onChange={(e) => {
                  setHostname(e.target.value)
                  setErrored(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                }}
                error={errored}
                shaking={shaking}
              />
            </div>

            <button
              type='button'
              onClick={handleAdd}
              disabled={adding}
              className='settings-save'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: adding ? 'default' : 'pointer',
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.24px',
                background: hostname.trim()
                  ? 'var(--text-strong)'
                  : 'var(--bg-surface)',
                color: hostname.trim()
                  ? 'var(--bg-default)'
                  : 'var(--text-sub)',
              }}
            >
              {adding ? <Spinner /> : null}
              {adding ? 'Adding' : 'Add domain'}
            </button>
          </div>
        ) : null}
      </div>

      {/* ─── Pending, with the DNS record to add ─── */}
      {pending.map((d) => (
        <div
          key={d.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
          }}
        >
          <p
            className='para-xs'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            Pending domain
          </p>

          {/* Two different headers, because adding is a TWO-step: you get a
              chance to correct the hostname and Save, and only then is it
              committed and checked. I had built each of these and then replaced
              one with the other — they're both real, at different points. */}
          {d.status === 'draft' ? (
            /* Just added. Still editable, because a typo here is likely and
               the domain hasn't been checked against anything yet. */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                width: '100%',
              }}
            >
              <div style={{ flex: '1 0 0', minWidth: 0, maxWidth: '340px' }}>
                <Inputfield
                  lefticon={<GlobeIcon />}
                  value={drafts[d.id] ?? d.hostname}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheck(d)
                  }}
                />
              </div>

              {canManage ? (
                <button
                  type='button'
                  onClick={() => handleCheck(d)}
                  disabled={checking === d.id}
                  className='plan-cta'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: checking === d.id ? 'default' : 'pointer',
                    flexShrink: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.24px',
                    background: 'var(--bg-weak)',
                    color: 'var(--text-inverse)',
                  }}
                >
                  {checking === d.id ? <Spinner /> : null}
                  {checking === d.id ? 'Saving' : 'Save'}
                </button>
              ) : null}
            </div>
          ) : (
            /* Committed. The hostname is settled; what changes now is whether
               DNS has caught up, which is a status rather than an edit. */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                width: '100%',
              }}
            >
              <p
                style={{
                  margin: 0,
                  minWidth: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '20px',
                  letterSpacing: '0.28px',
                  color: 'var(--text-strong)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.hostname}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '0 6px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
                >
                  <Tag
                    tone={d.status === 'failed' ? 'error' : 'pending'}
                    label={
                      d.status === 'failed'
                        ? 'Verification failed'
                        : 'Pending verification'
                    }
                    // Only while waiting. A pulsing dot on a failed check
                    // suggests something is still happening.
                    pulse={d.status === 'pending'}
                  />
                  {canManage ? (
                    <TagButton
                      onClick={() => handleCheck(d)}
                      label='Check again'
                      busy={checking === d.id}
                    >
                      <span
                        className={
                          checking === d.id ? 'domain-spinning' : undefined
                        }
                        style={{ display: 'flex' }}
                      >
                        <RefreshIcon />
                      </span>
                    </TagButton>
                  ) : null}
                </div>

                {canManage ? (
                  <Dropdown
                    align='right'
                    trigger={
                      <span style={{ display: 'flex' }}>
                        <MoreIcon />
                      </span>
                    }
                  >
                    <DropdownMenu>
                      <DropdownOption onClick={() => handleCheck(d)}>
                        Check again
                      </DropdownOption>
                      <DropdownOption danger onClick={() => handleRemove(d)}>
                        Remove domain
                      </DropdownOption>
                    </DropdownMenu>
                  </Dropdown>
                ) : null}
              </div>
            </div>
          )}

          {/* The error panel is for 'failed' ONLY — a CNAME that exists and
              points elsewhere. A domain merely waiting on DNS keeps the
              instructions, because it hasn't done anything wrong and showing it
              a red panel would say otherwise. */}
          {d.status === 'failed' ? (
            <>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'var(--error-mute)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <p
                  className='para-xs'
                  style={{ color: 'var(--error-base)', margin: 0 }}
                >
                  {d.lastError}
                </p>
              </div>

              {canManage ? (
                <button
                  type='button'
                  onClick={() => handleCheck(d)}
                  disabled={checking === d.id}
                  className='create-secondary'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: checking === d.id ? 'default' : 'pointer',
                    alignSelf: 'flex-start',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0.24px',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-sub)',
                  }}
                >
                  {checking === d.id ? <Spinner /> : null}
                  {checking === d.id ? 'Checking' : 'Retry verification'}
                </button>
              ) : null}
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '16px',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  lineHeight: 1,
                  letterSpacing: '0.2px',
                  color: 'var(--text-soft)',
                }}
              >
                {d.dns?.isApex
                  ? 'Add this record at your DNS provider. A root domain needs an A record — most providers write the root as @, some leave it blank.'
                  : 'Add this record at your DNS provider'}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  width: '100%',
                }}
              >
                {/* All three come from the server now. Type was hardcoded to
                    CNAME, which is wrong for an apex — DNS doesn't permit a
                    CNAME there at all, so anyone adding a root domain was being
                    told to create a record their provider would reject. */}
                <DnsRecord label='Type' value={d.dns?.type || 'CNAME'} />
                <DnsRecord label='Host' value={d.dns?.host || '@'} />
                <DnsRecord
                  label='Value'
                  value={d.dns?.value || data.cnameTarget}
                  copyable
                />
              </div>

              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  lineHeight: 1,
                  letterSpacing: '0.2px',
                  color: 'var(--text-soft)',
                }}
              >
                DNS changes can take up to 24 hours to propagate. Once the
                record resolves, the certificate is issued automatically and the
                domain starts serving links.
              </p>
            </div>
          )}
        </div>
      ))}

      {/* ─── Verified ─── */}
      {verified.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            <p
              className='para-xs'
              style={{
                color: 'var(--text-soft)',
                margin: 0,
                width: COL_HOST,
                flexShrink: 0,
              }}
            >
              Domains
            </p>
            <p
              className='para-xs'
              style={{ color: 'var(--text-soft)', margin: 0, flex: '1 0 0' }}
            >
              Clicks
            </p>
            <p
              className='para-xs'
              style={{ color: 'var(--text-soft)', margin: 0, flex: '1 0 0' }}
            >
              Status
            </p>
          </div>

          {verified.map((d) => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <p
                className='para-xs'
                style={{
                  color: 'var(--text-strong)',
                  margin: 0,
                  width: COL_HOST,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.hostname}
              </p>
              <p
                className='para-xs'
                style={{
                  color: 'var(--text-strong)',
                  margin: 0,
                  flex: '1 0 0',
                }}
              >
                {d.clicks.toLocaleString()}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  flex: '1 0 0',
                  minWidth: 0,
                }}
              >
                <span style={{ flex: '1 0 0', display: 'flex', minWidth: 0 }}>
                  <Tag tone='success' label='Verified' />
                </span>
                {canManage ? (
                  <Dropdown
                    align='right'
                    trigger={
                      <span style={{ display: 'flex' }}>
                        <MoreIcon />
                      </span>
                    }
                  >
                    <DropdownMenu>
                      <DropdownOption onClick={() => handleCheck(d)}>
                        Re-check DNS
                      </DropdownOption>
                      <DropdownOption danger onClick={() => handleRemove(d)}>
                        Remove domain
                      </DropdownOption>
                    </DropdownMenu>
                  </Dropdown>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
