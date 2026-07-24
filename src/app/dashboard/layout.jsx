'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import DashboardSkeleton from '@/components/dashboardskeleton'
import { ToastStack } from '@/components/toast'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [orgName, setOrgName] = useState('')
  const [allOrgs, setAllOrgs] = useState([])
  const [activeOrgId, setActiveOrgId] = useState(null)
  const [userImage, setUserImage] = useState(null)
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
        />
      </div>

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

      {children}

      <ToastStack />

      {/* Theme toggle only now — the Fire toast / Fire error buttons
          that used to sit alongside it are gone, done validating the
          toast itself. Still bottom-left so it doesn't collide with
          the toast stack or the mock-data pill, both bottom-right. */}
      <div
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          zIndex: 99,
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-full)',
            background: '#171717',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span className='label-sm' style={{ color: 'white' }}>
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </span>
        </button>
      </div>
    </main>
  )
}
