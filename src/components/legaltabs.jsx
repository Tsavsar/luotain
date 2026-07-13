'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Sliding-pill tab switcher for Terms / Privacy ───
// The background pill is one absolutely-positioned div that
// slides left/right depending on which route is active —
// same trick as your shake/pulse animations, just driven by
// pathname instead of hover/click state.

function LawShieldIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 18 18'
    >
      <g fill='currentColor'>
        <path d='m11.5625,15.8057c-.8008,0-1.5547-.312-2.1211-.8789l-1.4443-1.4448c-.5664-.5664-.8789-1.3198-.8789-2.1211s.3125-1.5547.8789-2.1211l2.7432-2.7427c.5615-.5649,1.3145-.8779,2.1172-.8789.8057,0,1.5596.3125,2.126.8799l1.0166,1.0171v-3.0352c0-.7646-.4893-1.4346-1.2168-1.666l-5.249-1.6797c-.3438-.1113-.7256-.1108-1.0674-.0005l-5.249,1.6797c-.7285.2319-1.2178.9019-1.2178,1.6665v6.52c0,3.5059,4.9453,5.3784,6.4629,5.8691.1758.0566.3564.0854.5371.0854s.3613-.0288.5381-.0859c.5701-.1843,1.6248-.5642,2.7191-1.1523-.2258.0535-.4568.0894-.6946.0894Z' />
        <path d='m16.7803,14.2197l-2.255-2.2554.8409-.8408c.2832-.2832.4395-.6602.4395-1.0605,0-.4014-.1562-.7778-.4395-1.0605l-1.4443-1.4448c-.2832-.2837-.6602-.4395-1.0605-.4395h-.002c-.4004.0005-.7773.1567-1.0586.4395l-2.7432,2.7427c-.2832.2832-.4395.6602-.4395,1.0605s.1562.7773.4395,1.0605l1.4443,1.4448c.2832.2832.6602.4395,1.0605.4395s.7773-.1562,1.0605-.4395l.8416-.8413,2.2551,2.2554c.1465.1465.3379.2197.5303.2197s.3838-.0732.5303-.2197c.293-.293.293-.7676,0-1.0605Z' />
      </g>
    </svg>
  )
}

function LockCircleIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 48 48'
    >
      <g fill='currentColor'>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M24 4C20.6863 4 18 6.68629 18 10V18.5H15V10C15 5.02944 19.0294 1 24 1C28.9706 1 33 5.02944 33 10V18.5H30V10C30 6.68629 27.3137 4 24 4Z'
        />
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M24 15C15.1634 15 8 22.1634 8 31C8 39.8366 15.1634 47 24 47C32.8366 47 40 39.8366 40 31C40 22.1634 32.8366 15 24 15ZM19 30C19 27.2386 21.2386 25 24 25C26.7614 25 29 27.2386 29 30C29 32.2388 27.5286 34.134 25.5 34.7711V39H22.5V34.7711C20.4714 34.134 19 32.2388 19 30Z'
        />
      </g>
    </svg>
  )
}

export default function LegalTabs() {
  const pathname = usePathname()
  const isPrivacy = pathname === '/privacy'

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: '8px',
        // wrapper sized to hold both tabs so the pill has a track to slide along
      }}
    >
      {/* --- sliding background pill --- */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isPrivacy ? '92px' : '0px', // adjust to match your Terms tab's actual width + 8px gap
          width: '96px', // adjust to match your Privacy tab's actual width
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface)',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0,
        }}
      />

      {/* --- Terms tab --- */}
      <Link
        href='/terms'
        className='label-sm'
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          color: isPrivacy ? 'var(--text-sub)' : 'var(--text-strong)',
          textDecoration: 'none',
          transition: 'color 0.3s ease',
        }}
      >
        <LawShieldIcon />
        Terms
      </Link>

      {/* --- Privacy tab --- */}
      <Link
        href='/privacy'
        className='label-sm'
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          color: isPrivacy ? 'var(--text-strong)' : 'var(--text-sub)',
          textDecoration: 'none',
          transition: 'color 0.3s ease',
        }}
      >
        <LockCircleIcon />
        Privacy
      </Link>
    </div>
  )
}
