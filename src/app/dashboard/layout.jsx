'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import DashboardSkeleton from '@/components/dashboardskeleton'
import { toast, ToastStack } from '@/components/toast'

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

      {/* Temporary testing cluster, same idea as the "Mock data: ON"
          pill on the analytics page. Bottom-LEFT on purpose, so it
          doesn't sit on top of the toast stack or the mock data
          pill, both of which live bottom-right. Pull this once
          you're done adjusting the toast and have real triggers
          (copy, save, etc.) to test with on their own. */}
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
          onClick={() => toast('Link copied to clipboard')}
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
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--success-base)',
              flexShrink: 0,
            }}
          />
          <span className='label-sm' style={{ color: 'white' }}>
            Fire toast
          </span>
        </button>

        <button
          onClick={() => toast.error('Failed to save changes')}
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
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--error-base)',
              flexShrink: 0,
            }}
          />
          <span className='label-sm' style={{ color: 'white' }}>
            Fire error
          </span>
        </button>

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
