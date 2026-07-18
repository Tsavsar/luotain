'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import DashboardSkeleton from '@/components/dashboardskeleton'

// ─── DashboardLayout ───
// The guard, menu, and nav are shared chrome across all three tabs —
// living here means they mount ONCE and persist across tab switches,
// instead of re-checking auth and re-fetching org info every time you
// click a different tab. {children} is whichever tab's page.jsx is
// currently active.
export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [orgName, setOrgName] = useState('')
  const [userImage, setUserImage] = useState(null)

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
        className='dashboard-section dashboard-section-1'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '36px 24px 24px 24px',
        }}
      >
        <DashboardMenu orgName={orgName} userImage={userImage} />
      </div>

      <div
        className='dashboard-section dashboard-section-2'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 24px 24px 24px',
        }}
      >
        <DashboardNav />
      </div>

      {children}
    </main>
  )
}
