'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import DashboardSkeleton from '@/components/dashboardskeleton'
import { ToastStack } from '@/components/toast'
import { MotionConfig } from 'motion/react'
import Switch from '@/components/switch'
import {
  MockDataProvider,
  useMockDataState,
} from '@/components/mockdatacontext'

// Split out because it needs to be INSIDE the provider to read it, and
// DashboardLayout is the thing rendering the provider.
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

  useEffect(() => {
    if (checking) return

    async function loadInfo() {
      try {
        const res = await fetch('/api/dashboard-info')
        const data = await res.json()
        setOrgName(data.orgName)
        setAllOrgs(data.allOrgs || [])
        setActiveOrgId(data.activeOrgId)
        setUserImage(data.userImage)
      } catch (err) {
        setOrgName('Your Organization')
      }
    }
    loadInfo()
  }, [checking])

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
