'use client'

import { useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import BackButton from '@/components/backbutton'
import SettingsNav from '@/components/settingsnav'
import useIsMobile from '@/components/useismobile'

// ─── Settings layout ───
// Two layouts, one route tree.
//
// Desktop: sidebar of sections beside the panel, both always visible.
//
// Mobile: master-detail. /dashboard/settings is the list of sections and
// nothing else; tapping one goes into it, and Back returns to the list
// rather than leaving settings. A 170px sidebar next to a panel doesn't fit
// a phone, and stacking it above the content would mean scrolling past
// eleven links to reach the thing you tapped.
export default function SettingsLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  const atIndex = pathname === '/dashboard/settings'

  // Where Back should go when leaving settings entirely. Captured in a ref
  // on first mount and never recomputed, which is the whole trick: this
  // layout persists while you move between sections, so the ref keeps
  // holding the page you were on BEFORE you came in.
  //
  // Plain router.back() is wrong here — it walks browser history, and every
  // section you visit pushes an entry, so it would step backwards through
  // the settings tabs one at a time instead of leaving.
  //
  // ?from= is set by whatever opened settings (the profile menu). Without
  // it — a hard refresh, or a link straight into a section — there's
  // nothing to return to, so it falls back to the dashboard.
  const exitTo = useRef(null)
  if (exitTo.current === null) {
    const from = searchParams.get('from')
    exitTo.current =
      from && from.startsWith('/') ? from : '/dashboard/analytics'
  }

  // Null until the media query has been read. Rendering either layout
  // before then would flash the wrong one.
  if (isMobile === null) return null

  if (isMobile) {
    return (
      <div
        className='dashboard-section dashboard-section-3 dashboard-page-padding'
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: '64px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            display: 'flex',
            flexDirection: 'column',
            gap: '21px',
          }}
        >
          {/* On the list, Back leaves settings. Inside a section, it
              returns to the list — one step at a time, which is what a
              master-detail flow should do. */}
          <BackButton
            onBack={() =>
              atIndex
                ? router.push(exitTo.current)
                : router.push('/dashboard/settings')
            }
          />

          {atIndex ? <SettingsNav variant='list' /> : children}
        </div>
      </div>
    )
  }

  return (
    <div
      className='dashboard-section dashboard-section-3 dashboard-page-padding'
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        // 0 — the dashboard header already carries 24px below it. Anything
        // here stacks on top of that.
        paddingTop: 0,
        paddingBottom: '64px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          // 46px: the design's sidebar ends at 530 and the panel starts at
          // 576 within a 720 column.
          gap: '46px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '21px',
            flexShrink: 0,
          }}
        >
          <BackButton onBack={() => router.push(exitTo.current)} />
          <SettingsNav />
        </div>

        {/* min-width 0 so a long value inside can ellipsis rather than
            forcing the whole panel wider and squeezing the sidebar. */}
        <div style={{ flex: '1 0 0', minWidth: 0 }}>{children}</div>
      </div>
    </div>
  )
}
