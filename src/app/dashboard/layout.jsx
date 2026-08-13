'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import DashboardSkeleton from '@/components/dashboardskeleton'
import { ToastStack } from '@/components/toast'
import { getProfile } from '@/lib/profilecache'
import { MotionConfig } from 'motion/react'
import Switch from '@/components/switch'
import {
  MockDataProvider,
  useMockDataState,
} from '@/components/mockdatacontext'

// Split out because it needs to be INSIDE the provider to read it, and
// DashboardLayout is the thing rendering the provider.
// Which tier the MOCK data pretends to be on. Distinct from PlanToggle below,
// which writes a real plan to the database and needs ALLOW_PLAN_TOGGLE — this
// changes nothing and is how you look at each tier's paywalls and billing state
// without touching a workspace.
//
// Only rendered with mock data on: a plan picker that does nothing to real data
// would be a control that appears broken.
function MockPlanPicker() {
  const { useMockData, mockPlan, setMockPlan, ready } = useMockDataState()
  if (!ready || !useMockData) return null

  return (
    <div
      role='group'
      aria-label='Mock plan'
      style={{
        display: 'flex',
        gap: '2px',
        padding: '3px',
        borderRadius: '10px',
        background: 'var(--bg-surface)',
      }}
    >
      {['FREE', 'STARTER', 'PRO'].map((id) => (
        <button
          key={id}
          type='button'
          onClick={() => setMockPlan(id)}
          aria-pressed={mockPlan === id}
          className='qr-view-option'
          style={{
            padding: '3px 10px',
            borderRadius: '7px',
            border: 'none',
            background: mockPlan === id ? 'var(--bg-default)' : 'transparent',
            color: mockPlan === id ? 'var(--text-strong)' : 'var(--text-soft)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            lineHeight: '16px',
            letterSpacing: '0.22px',
          }}
        >
          {id === 'FREE' ? 'Free' : id === 'STARTER' ? 'Starter' : 'Pro'}
        </button>
      ))}
    </div>
  )
}

function MockDataToggle() {
  const { useMockData, toggleMockData, ready } = useMockDataState()
  return (
    <Switch
      checked={useMockData}
      onChange={toggleMockData}
      disabled={!ready}
      label={`Mock data${useMockData ? '' : ''}`}
    />
  )
}

// A testing switch for plan-gated UI, sitting with the mock-data toggle.
//
// Two states rather than three, deliberately: what needs exercising is free
// versus paid, and a three-way control for a binary question is more fiddly
// than useful. Switching to paid picks PRO because it's the tier with every
// capability turned on — Starter's gates are a subset of Free's.
//
// Renders nothing unless the endpoint is enabled, so it disappears the moment
// ALLOW_PLAN_TOGGLE is removed rather than sitting there failing.
function PlanToggle() {
  const [plan, setPlan] = useState(null)
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        setPlan(d.plan)
        // One GET, and it tells us both things. The previous version fired a
        // no-op PATCH to see whether the route was enabled, which 404'd by
        // design and logged a console error on every load.
        setAvailable(Boolean(d.toggleAvailable))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!available || !plan) return null

  // All three, not a Free/Pro switch. Starter was unreachable, which meant the
  // whole middle tier — its limits, its billing state, every paywall that says
  // "upgrade to Pro" rather than "upgrade" — could never be seen while testing.
  async function setTo(next) {
    if (busy || next === plan) return
    setBusy(true)
    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      })
      if (res.ok) {
        setPlan(next)
        // Reloaded rather than announced by event: plan changes what several
        // pages render and what the API allows, and a plan switch during
        // testing is worth a clean slate over a partial refresh.
        window.location.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role='group'
      aria-label='Plan (dev)'
      style={{
        display: 'flex',
        gap: '2px',
        padding: '3px',
        borderRadius: '10px',
        background: 'var(--bg-surface)',
      }}
    >
      {['FREE', 'STARTER', 'PRO'].map((id) => (
        <button
          key={id}
          type='button'
          onClick={() => setTo(id)}
          disabled={busy}
          aria-pressed={plan === id}
          className='qr-view-option'
          style={{
            padding: '3px 10px',
            borderRadius: '7px',
            border: 'none',
            background: plan === id ? 'var(--bg-default)' : 'transparent',
            color: plan === id ? 'var(--text-strong)' : 'var(--text-soft)',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            lineHeight: '16px',
            letterSpacing: '0.22px',
          }}
        >
          {id === 'FREE' ? 'Free' : id === 'STARTER' ? 'Starter' : 'Pro'}
        </button>
      ))}
    </div>
  )
}

function DashboardShell({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  // Pages nested UNDER /dashboard/links (trash, a single link's detail
  // page) are secondary pages one level down, not one of the three
  // top-level tabs — none of Analytics/Links/QR codes corresponds to
  // them, so showing that row would leave it either highlighted on
  // nothing or wrongly highlighted as Links. The trailing slash is
  // what keeps /dashboard/links itself (which SHOULD show the nav)
  // out of this.
  // Create is a focused, single-task page like the link subpages — none
  // of the three tabs corresponds to it, so the row would be either
  // highlighted on nothing or wrongly highlighted as Links.
  const hideNav =
    pathname?.startsWith('/dashboard/links/') ||
    pathname?.startsWith('/dashboard/create') ||
    // Settings has its own sidebar nav — the top tab row alongside it
    // would be two navigations competing, and none of the three tabs
    // corresponds to a settings section anyway.
    pathname?.startsWith('/dashboard/settings')

  // Create is a single-task page: the header drops to just the logo and
  // the profile, and narrows to match the form's own 440px column
  // instead of the usual 720px content width. Because this layout stays
  // mounted across navigation, that narrowing animates.
  const compactHeader = pathname?.startsWith('/dashboard/create')
  const [checking, setChecking] = useState(true)
  const [orgName, setOrgName] = useState('')
  const [orgImage, setOrgImage] = useState(null)
  const [orgAvatarSeed, setOrgAvatarSeed] = useState(null)
  const [allOrgs, setAllOrgs] = useState([])
  const [activeOrgId, setActiveOrgId] = useState(null)
  const [userImage, setUserImage] = useState(null)
  const [userName, setUserName] = useState('')
  const [avatarSeed, setAvatarSeed] = useState(null)
  // Testing-only theme override — reads whatever's already on <html>
  // (your real [data-theme] mechanism from globals.css) so this
  // starts in sync, then just flips that same attribute directly.
  // Nothing new here, this is the exact switch your CSS already
  // looks for.
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const current = document.documentElement.dataset.theme
    if (current === 'light' || current === 'dark') setTheme(current)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
  }

  useEffect(() => {
    async function guard() {
      try {
        const res = await fetch('/api/check-membership')
        const data = await res.json()

        if (!data.loggedIn) {
          router.replace('/login')
          return
        }

        if (!data.hasOrg) {
          router.replace('/onboarding')
          return
        }

        setChecking(false)
      } catch (err) {
        router.replace('/login')
      }
    }
    guard()
  }, [router])

  // The user's own profile. /api/dashboard-info answers "which org am I
  // in" and carries no name or avatar seed, so without this the header
  // avatar fell back to a default gradient while settings showed the real
  // one — they were reading different sources.
  useEffect(() => {
    if (checking) return
    let cancelled = false

    function loadProfile(force) {
      // Shared with the settings panels — the same profile was being
      // fetched twice on every settings visit.
      getProfile({ force })
        .then((user) => {
          if (cancelled || !user) return
          setUserName(user.name || '')
          setAvatarSeed(user.avatarSeed || null)
          setUserImage(user.image || null)
        })
        .catch(() => {})
    }

    loadProfile()

    // A save has to bypass the cache, or the header would keep showing the
    // profile from before the edit.
    const onUpdated = () => loadProfile(true)

    // Re-read when the profile is saved elsewhere. The settings page lives
    // inside this layout but can't reach up into its state, and a context
    // for one value that changes rarely is more machinery than it's worth.
    // An event keeps them decoupled: settings announces, anything that
    // renders an avatar listens.
    window.addEventListener('luotain:profile-updated', onUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('luotain:profile-updated', onUpdated)
    }
  }, [checking])

  useEffect(() => {
    if (checking) return

    async function loadInfo() {
      try {
        const res = await fetch('/api/dashboard-info')
        const data = await res.json()
        setAllOrgs(data.allOrgs || [])
        setActiveOrgId(data.activeOrgId)
        // Deliberately NOT setting the avatar here. /api/me owns it —
        // two fetches writing the same state raced, and this one won, so
        // removing a photo in settings left the old one in the header and
        // the gradient never got a chance to render.
        setOrgName(data.orgName)
        setOrgImage(data.orgImage || null)
        setOrgAvatarSeed(data.orgAvatarSeed || null)
      } catch (err) {
        setOrgName('Your Organization')
      }
    }
    loadInfo()
  }, [checking])

  // Renaming the workspace in settings updates the header immediately.
  // /api/dashboard-info is fetched once on mount, so without this the old name
  // sat in the header until a reload — the same problem primeProfile solves for
  // the account avatar, which is why that one already worked.
  useEffect(() => {
    function onOrgUpdated(e) {
      if (!e.detail) return
      if (e.detail.name) setOrgName(e.detail.name)
      // Checked with `in` rather than truthiness: removing the picture sends
      // null, and a truthy check would treat that as "nothing changed" and
      // leave the old photo in the header.
      if ('image' in e.detail) setOrgImage(e.detail.image)
      if ('avatarSeed' in e.detail) setOrgAvatarSeed(e.detail.avatarSeed)
    }
    window.addEventListener('luotain:org-updated', onOrgUpdated)
    return () => window.removeEventListener('luotain:org-updated', onOrgUpdated)
  }, [])

  if (checking) return <DashboardSkeleton />

  return (
    // reducedMotion='user' makes every Motion animation in this tree
    // respect the OS "reduce motion" setting. It's here rather than
    // inside each icon because Motion animates in JavaScript, so the
    // blanket reduced-motion rule in globals.css can't reach it — that
    // rule only overrides CSS animation-duration. One switch covers
    // every lucide-animated icon, including ones added later, with no
    // per-icon code to lose when the CLI overwrites a file.
    <MotionConfig reducedMotion='user'>
      <main
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          className='dashboard-section dashboard-section-1 dashboard-page-padding'
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '36px',
            paddingBottom: '24px',
          }}
        >
          <DashboardMenu
            orgName={orgName}
            orgImage={orgImage}
            orgAvatarSeed={orgAvatarSeed}
            allOrgs={allOrgs}
            activeOrgId={activeOrgId}
            userImage={userImage}
            userName={userName}
            avatarSeed={avatarSeed}
            compact={compactHeader}
            maxWidth={compactHeader ? '440px' : '720px'}
          />
        </div>

        {!hideNav && (
          <div
            className='dashboard-section dashboard-section-2 dashboard-page-padding'
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '12px',
              paddingBottom: '40px',
            }}
          >
            <DashboardNav />
          </div>
        )}

        {children}

        <ToastStack />

        {/* Testing controls, one cluster. The mock-data toggle lives here
          rather than on each page: it used to be a separate button on
          the links, trash, detail and analytics pages, each with its
          own state, so switching it on and then navigating anywhere
          silently turned it back off. One toggle, shared state, and it
          survives a reload. */}
        <div
          style={{
            position: 'fixed',
            left: '20px',
            bottom: '20px',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            background: '#171717',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <MockDataToggle />

          <MockPlanPicker />

          <span
            aria-hidden='true'
            style={{
              width: '1px',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
            }}
          />

          <PlanToggle />

          <span
            aria-hidden='true'
            style={{
              width: '1px',
              height: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
            }}
          />

          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span
              className='para-xs'
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </main>
    </MotionConfig>
  )
}

// Provider sits outside the shell so the toggle and every page below it
// share one source of truth.
export default function DashboardLayout({ children }) {
  return (
    <MockDataProvider>
      <DashboardShell>{children}</DashboardShell>
    </MockDataProvider>
  )
}
