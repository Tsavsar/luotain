'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardMenu from '@/components/dashboardmenu'
import DashboardNav from '@/components/dashboardnav'
import StatsSegment from '@/components/statssegment'
import Grid from '@/components/grid'

export default function DashboardPage() {
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

  if (checking) return null

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
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 24px 24px 24px',
        }}
      >
        <DashboardNav />
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px 24px',
        }}
      >
        <StatsSegment />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Grid empty />
        <p className='title-h4' style={{ color: 'var(--text-strong)' }}>
          Dashboard
        </p>
      </div>
    </main>
  )
}
