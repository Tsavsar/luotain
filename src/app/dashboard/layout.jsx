'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import DashboardSkeleton from '@/components/dashboardskeleton'
import { ToastStack } from '@/components/toast'
import DevControls from '@/components/devcontrols'
import { getProfile } from '@/lib/profilecache'
import { MotionConfig } from 'motion/react'
import {
  MockDataProvider,
  useMockDataState,
} from '@/components/mockdatacontext'

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

        {/* One panel, collapsible — see DevControls. It was a fixed
            horizontal strip, and every control added to it made that strip
            wider: two three-button pickers had stretched it across a third of
            the screen with nothing labelled. */}
        <DevControls theme={theme} onToggleTheme={toggleTheme} />
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
