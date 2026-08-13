'use client'

import { useEffect, useState } from 'react'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Dev controls ───
// Mock data, the tier it pretends to be, the real plan, and the theme.
//
// Every row is ALWAYS visible. The previous version hid the mock plan picker
// until mock data was switched on and the real plan picker unless an env var
// was set — so with both off the panel showed no plan control at all, which is
// indistinguishable from it being broken. A dev panel hiding its own controls
// to look tidy is the wrong trade.
//
// Colours are hardcoded, not tokens: this is scaffolding sitting over the app
// and it has to stay legible whatever it's covering. Tokens would make it match
// the page and disappear into it, which is what the first version did.
const OPEN_KEY = 'luotain:dev-open'

const PANEL = '#1c1c1c'
const BORDER = 'rgba(255, 255, 255, 0.1)'
const DIM = 'rgba(255, 255, 255, 0.4)'
const TEXT = 'rgba(255, 255, 255, 0.9)'
const TRACK = 'rgba(255, 255, 255, 0.07)'
const ACTIVE = 'rgba(255, 255, 255, 0.13)'

const PLAN_OPTIONS = [
  { id: 'FREE', label: 'Free' },
  { id: 'STARTER', label: 'Starter' },
  { id: 'PRO', label: 'Pro' },
]

function Row({ label, hint, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        width: '100%',
      }}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            lineHeight: '15px',
            letterSpacing: '0.2px',
            color: TEXT,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {hint ? (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              lineHeight: '13px',
              letterSpacing: '0.2px',
              color: DIM,
              whiteSpace: 'nowrap',
            }}
          >
            {hint}
          </span>
        ) : null}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {children}
      </span>
    </div>
  )
}

// The panel's own segmented control. The app's SegmentedTabs reads theme
// tokens, which go invisible on a dark panel in light mode.
function Segmented({ options, value, onChange, disabled }) {
  return (
    <span
      style={{
        display: 'flex',
        gap: '1px',
        padding: '2px',
        borderRadius: '8px',
        background: TRACK,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type='button'
          onClick={() => onChange(o.id)}
          disabled={disabled}
          aria-pressed={value === o.id}
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            border: 'none',
            background: value === o.id ? ACTIVE : 'transparent',
            color: value === o.id ? TEXT : DIM,
            cursor: disabled ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            lineHeight: '14px',
            letterSpacing: '0.2px',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          {o.label}
        </button>
      ))}
    </span>
  )
}

function Pill({ on, onClick, disabled }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      role='switch'
      aria-checked={on}
      style={{
        position: 'relative',
        width: '28px',
        height: '16px',
        borderRadius: '999px',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        background: on ? 'var(--primary-base)' : 'rgba(255, 255, 255, 0.15)',
        transition: 'background 0.18s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? '15px' : '3px',
          width: '10px',
          height: '10px',
          borderRadius: '999px',
          background: '#fff',
          transition: 'left 0.18s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      />
    </button>
  )
}

function Divider() {
  return (
    <span
      aria-hidden='true'
      style={{
        height: '1px',
        width: '100%',
        background: BORDER,
        flexShrink: 0,
      }}
    />
  )
}

export default function DevControls({ theme, onToggleTheme }) {
  const {
    useMockData,
    setMockData,
    toggleMockData,
    mockPlan,
    setMockPlan,
    ready,
  } = useMockDataState()

  const [open, setOpen] = useState(false)
  const [realPlan, setRealPlan] = useState(null)
  const [planAvailable, setPlanAvailable] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(OPEN_KEY) === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setRealPlan(d.plan)
        setPlanAvailable(Boolean(d.toggleAvailable))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function setOpenPersisted(next) {
    setOpen(next)
    try {
      window.localStorage.setItem(OPEN_KEY, String(next))
    } catch {}
  }

  // Picking a tier turns mock data ON. Choosing a mock plan while mock data is
  // off changes nothing visible, which is the trap the last version set: the
  // control worked, it just had no effect anyone could see.
  function chooseMockPlan(next) {
    setMockPlan(next)
    if (!useMockData) setMockData(true)
  }

  async function setRealPlanTo(next) {
    if (busy || next === realPlan) return
    setBusy(true)
    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      })
      if (res.ok) {
        // Reloaded rather than announced: the plan changes what several pages
        // render and what the API allows.
        window.location.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpenPersisted(true)}
        aria-label='Dev controls'
        className='dev-trigger'
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '7px 12px',
          borderRadius: '999px',
          background: PANEL,
          border: `1px solid ${BORDER}`,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          lineHeight: '14px',
          letterSpacing: '0.3px',
          color: DIM,
        }}
      >
        {/* Shows the current state, so the collapsed pill still answers "what
            am I looking at" without being opened. */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            background: useMockData
              ? 'var(--primary-base)'
              : 'rgba(255,255,255,0.25)',
          }}
        />
        {useMockData
          ? `Mock · ${mockPlan[0] + mockPlan.slice(1).toLowerCase()}`
          : 'Dev'}
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '20px',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        gap: '11px',
        width: '268px',
        padding: '13px 14px',
        borderRadius: '14px',
        background: PANEL,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            lineHeight: '13px',
            letterSpacing: '0.7px',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          Dev controls
        </span>
        <button
          type='button'
          onClick={() => setOpenPersisted(false)}
          aria-label='Close'
          className='dev-close'
          style={{
            display: 'flex',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: DIM,
          }}
        >
          <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M4.5 4.5l7 7M11.5 4.5l-7 7'
              stroke='currentColor'
              strokeWidth='1.6'
              strokeLinecap='round'
            />
          </svg>
        </button>
      </div>

      <Divider />

      <Row label='Mock data'>
        <Pill on={useMockData} onClick={toggleMockData} disabled={!ready} />
      </Row>

      {/* Always shown. Picking a tier switches mock data on, so this can't be a
          control that silently does nothing. */}
      <Row label='Mock plan' hint={useMockData ? null : 'turns mock data on'}>
        <Segmented
          options={PLAN_OPTIONS}
          value={mockPlan}
          onChange={chooseMockPlan}
        />
      </Row>

      <Divider />

      {/* Also always shown, disabled where the endpoint is off — an absent
          control looks broken, a disabled one with a reason doesn't. */}
      <Row
        label='Real plan'
        hint={
          planAvailable ? 'writes to the database' : 'set ALLOW_PLAN_TOGGLE'
        }
      >
        <Segmented
          options={PLAN_OPTIONS}
          value={realPlan || 'FREE'}
          onChange={setRealPlanTo}
          disabled={!planAvailable || busy}
        />
      </Row>

      <Divider />

      <Row label='Theme'>
        <Segmented
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
          value={theme === 'dark' ? 'dark' : 'light'}
          onChange={(id) => {
            if ((id === 'dark') !== (theme === 'dark')) onToggleTheme()
          }}
        />
      </Row>
    </div>
  )
}
