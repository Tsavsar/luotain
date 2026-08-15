'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Inputfield from '@/components/input'
import Tag from '@/components/tag'
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
    dnsHost: 'links',
    verified: true,
    links: 12,
    clicks: 40,
  },
  {
    id: 'd2',
    hostname: 'go.acme.com',
    dnsHost: 'go',
    verified: true,
    links: 5,
    clicks: 21,
  },
]

// The two failures worth telling apart: a record that exists but points
// somewhere else, and a hostname that doesn't resolve at all.
const WRONG_TARGET = {
  id: 'd4',
  hostname: 'links.wrongtarget.co',
  dnsHost: 'links',
  verified: false,
  links: 0,
  clicks: 0,
  lastError: 'Found a CNAME pointing at ghs.googlehosted.com instead',
}

const TYPO = {
  id: 'd5',
  hostname: 'go.acmee.com',
  dnsHost: 'go',
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
  dnsHost: 'try',
  verified: false,
  links: 0,
  clicks: 0,
  lastError: null,
}

function mockDomainsFor(state) {
  if (state === 'empty') return []
  if (state === 'pending') return [WAITING]
  if (state === 'failed') return [WRONG_TARGET, TYPO]
  if (state === 'verified') return VERIFIED
  return [...VERIFIED, WAITING, WRONG_TARGET, TYPO]
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
  // Keyed by domain id. The pending row is an editable field, so each one needs
  // its own working value — a single string would have two pending domains
  // sharing one input.
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

  // Save: sends the edited hostname if it changed, then checks DNS. One
  // request rather than rename-then-verify, so the two can't disagree about
  // which domain was actually looked up.
  async function handleSave(domain) {
    if (useMockData) {
      toast('Mock data is on — nothing was saved')
      return
    }
    const edited = (drafts[domain.id] ?? domain.hostname).trim()
    if (!edited) {
      flag()
      toast.error('Enter a domain')
      return
    }

    setChecking(domain.id)
    try {
      const res = await fetch(`/api/org/domains/${domain.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: edited }),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(d?.error || "Couldn't check the domain")
        return
      }
      // The draft is dropped so the field falls back to whatever the server
      // now holds. Keeping it would leave a stale edit sitting over a renamed
      // domain, which looks like the save didn't take.
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
  const pending = data.domains.filter((d) => !d.verified)
  const verified = data.domains.filter((d) => d.verified)

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
      <span
        style={{ display: 'flex', color: 'var(--text-soft)', flexShrink: 0 }}
      >
        <HelpIcon />
      </span>
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

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Editable, not a label. A pending domain is most often pending
                because of a typo, and an uneditable one means the only fix is
                remove and re-add — losing the DNS record you'd already set up
                against it. */}
            <div style={{ flex: '1 0 0', minWidth: 0 }}>
              <Inputfield
                lefticon={<GlobeIcon />}
                value={drafts[d.id] ?? d.hostname}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave(d)
                }}
              />
            </div>

            {canManage ? (
              <button
                type='button'
                onClick={() => handleSave(d)}
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
              Add this record at your DNS provider
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                width: '100%',
              }}
            >
              <DnsRecord label='Type' value='CNAME' />
              <DnsRecord label='Host' value={d.dnsHost} />
              <DnsRecord label='Value' value={data.cnameTarget} copyable />
            </div>

            {/* The last check's result, when there's been one. Saying nothing
                after a failed verify leaves someone guessing whether it ran. */}
            {d.lastError ? (
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  lineHeight: 1.4,
                  letterSpacing: '0.2px',
                  color: 'var(--text-sub)',
                }}
              >
                {d.lastError}
              </p>
            ) : null}

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
              DNS changes can take up to 24 hours to propagate.
            </p>
          </div>
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
                      <DropdownOption onClick={() => handleSave(d)}>
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
