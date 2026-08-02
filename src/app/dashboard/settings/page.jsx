'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useIsMobile from '@/components/useismobile'

// ─── /dashboard/settings ───
// The index does no work of its own.
//
// On mobile it's the list of sections, which the settings layout renders —
// so this returns nothing and gets out of the way.
//
// On desktop there's no "list" state (the sidebar is always there), so
// landing here means landing on nothing. It redirects to the first section
// instead. replace() rather than push(), so Back doesn't bounce off this
// route on the way out of settings.
export default function SettingsIndexPage() {
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile === false) {
      router.replace('/dashboard/settings/general')
    }
  }, [isMobile, router])

  return null
}
