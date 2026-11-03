'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardSkeleton from '@/components/dashboardskeleton'
import { setDemoCookie } from '@/lib/demo'

// ─── /demo ───
// Where "View a demo" goes. Turns the demo on for this browser session and
// hands over to the dashboard, which takes it from there (lib/demo.js). The
// dashboard's own skeleton in the meantime, so the hand-over doesn't flash.
export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    setDemoCookie()
    router.replace('/dashboard/analytics')
  }, [router])

  return <DashboardSkeleton />
}
