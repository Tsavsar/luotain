'use client'

import { useEffect, useState } from 'react'
import { useMockDataState } from '@/components/mockdatacontext'

// ─── Dev controls ───
// The testing panel: mock data, which tier it pretends to be, the real plan,
// and the theme.
//
// Collapsed by default and remembered, because this sits over the app and every
// control added to it made the old horizontal strip wider — two three-button
// pickers had pushed it across a third of the screen with nothing labelled.
//
// Colours are hardcoded rather than tokens, deliberately: this is scaffolding
// that has to stay legible over whatever it's covering. The previous version
// used #171717, which is the page background in dark mode — the panel
// disappeared into it, leaving the controls floating on nothing.
const OPEN_KEY = 'luotain:dev-open'

const PANEL = '#1c1c1c'
const BORDER = 'rgba(255, 255, 255, 0.12)'
const LABEL = 'rgba(255, 255, 255, 0.45)'
const TEXT = 'rgba(255, 255, 255, 0.85)'
const ACTIVE_BG = 'rgba(255, 255, 255, 0.14)'

function Row({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          lineHeight: '16px',
          letterSpacing: '0.22px',
          color: LABEL,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// A segmented picker in the panel's own palette. The app's SegmentedTabs reads
// theme tokens, which would make it invisible on this dark panel in light mode.
function Segmented({ options, value, onChange, disabled }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '2px',
        padding: '2px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.06)',
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
            padding: '3px 9px',
            borderRadius: '6px',
            border: 'none',
            background: value === o.id ? ACTIVE_BG : 'transparent',
            color: value === o.id ? TEXT : LABEL,
            cursor: disabled ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            lineHeight: '16px',
            letterSpacing: '0.22px',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
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
        width: '30px',
        height: '18px',
        borderRadius: '999px',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        background: on ? 'var(--primary-base)' : 'rgba(255, 255, 255, 0.16)',
        transition: 'background 0.18s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: on ? '15px' : '3px',
          width: '12px',
          height: '12px',
          borderRadius: '999px',
          background: '#fff',
          transition: 'left 0.18s var(--ease-out)',
        }}
      />
    </button>
  )
}

function GearIcon() {
  return (
    <svg
      width='15'
      height='15'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='8' cy='8' r='2.2' stroke='currentColor' strokeWidth='1.3' />
      <path
        d='M8 1.8v1.4M8 12.8v1.4M14.2 8h-1.4M3.2 8H1.8M12.4 3.6l-1 1M4.6 11.4l-1 1M12.4 12.4l-1-1M4.6 4.6l-1-1'
        stroke='currentColor'
        strokeWidth='1.3'
        strokeLinecap='round'
      />
    </svg>
  )
}

export default function DevControls({ theme, onToggleTheme }) {
  const { useMockData, toggleMockData, mockPlan, setMockPlan, ready } =
    useMockDataState()

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
        // render and what the API allows, and a switch during testing is worth
        // a clean slate over a partial refresh.
        window.location.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  const PLAN_OPTIONS = [
    { id: 'FREE', label: 'Free' },
    { id: 'STARTER', label: 'Starter' },
    { id: 'PRO', label: 'Pro' },
  ]

  if (!open) {
    return (
      <button
        type='button'
        onClick={() => setOpenPersisted(true)}
        aria-label='Open dev controls'
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '999px',
          background: PANEL,
          border: `1px solid ${BORDER}`,
          color: TEXT,
          cursor: 'pointer',
          // Muted until hovered — it's scaffolding, and it shouldn't compete
          // with the app it's sitting on top of.
          opacity: 0.55,
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.55')}
      >
        <GearIcon />
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
        gap: '12px',
        // Sized to its content, with a floor so the rows don't jump as the
        // conditional ones appear.
        minWidth: '260px',
        padding: '14px',
        borderRadius: '14px',
        background: PANEL,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
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
            fontSize: '11px',
            lineHeight: '16px',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            color: LABEL,
          }}
        >
          Dev
        </span>
        <button
          type='button'
          onClick={() => setOpenPersisted(false)}
          aria-label='Close dev controls'
          style={{
            display: 'flex',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: LABEL,
          }}
        >
          <svg
            width='14'
            height='14'
            viewBox='0 0 16 16'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M4.5 4.5l7 7M11.5 4.5l-7 7'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
          </svg>
        </button>
      </div>

      <Row label='Mock data'>
        <Pill on={useMockData} onClick={toggleMockData} disabled={!ready} />
      </Row>

      {/* Only with mock on — a mock plan picker that changes nothing visible
          would read as broken. */}
      {useMockData ? (
        <Row label='Mock plan'>
          <Segmented
            options={PLAN_OPTIONS}
            value={mockPlan}
            onChange={setMockPlan}
          />
        </Row>
      ) : null}

      {/* Only where the endpoint is enabled. This writes a REAL plan to the
          database, which is why it's separated from the mock one above rather
          than sitting next to it unlabelled. */}
      {planAvailable && realPlan ? (
        <Row label='Real plan'>
          <Segmented
            options={PLAN_OPTIONS}
            value={realPlan}
            onChange={setRealPlanTo}
            disabled={busy}
          />
        </Row>
      ) : null}

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
