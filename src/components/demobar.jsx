'use client'

import Link from 'next/link'
import { leaveDemo } from '@/lib/demo'
import './demobar.css'

// ─── Demo bar ───
// Across the top of the dashboard while it's the demo (lib/demo.js): what
// this is, the way out, and the way in. On every page rather than a one-off
// notice, because every page is somewhere a visitor might try to save
// something and wonder where it went.
//
// Both actions clear the demo before they go, so the next visit to the
// dashboard is a real one: back to the site, or into signing up. Links for
// what they are, with the client-side navigation cancelled for a full one,
// which leaves the demo's stand-in API behind with the page.
export default function DemoBar() {
  function go(e, to) {
    e.preventDefault()
    leaveDemo(to)
  }

  return (
    <div className='demobar dashboard-page-padding' role='region' aria-label='Demo'>
      <div className='demobar-inner'>
        <p className='demobar-text para-sm'>
          <span className='demobar-lead'>Demo workspace</span>
          <span className='demobar-note'>
            Look around. Nothing you change here is saved.
          </span>
        </p>
        <div className='demobar-actions'>
          <Link
            href='/'
            prefetch={false}
            className='demobar-exit label-sm focus-ring-grey'
            onClick={(e) => go(e, '/')}
          >
            Exit demo
          </Link>
          <Link
            href='/get-started'
            prefetch={false}
            className='demobar-start label-sm focus-ring'
            onClick={(e) => go(e, '/get-started')}
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  )
}
