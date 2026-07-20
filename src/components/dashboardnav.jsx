'use client'

import { useRef, useState, useLayoutEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function AnalyticsIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M10.5 4H9.5C9.22386 4 9 4.22386 9 4.5V15.5C9 15.7761 9.22386 16 9.5 16H10.5C10.7761 16 11 15.7761 11 15.5V4.5C11 4.22386 10.7761 4 10.5 4Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M4.5 9H3.5C3.22386 9 3 9.22386 3 9.5V15.5C3 15.7761 3.22386 16 3.5 16H4.5C4.77614 16 5 15.7761 5 15.5V9.5C5 9.22386 4.77614 9 4.5 9Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M16.5 13H15.5C15.2239 13 15 13.2239 15 13.5V15.5C15 15.7761 15.2239 16 15.5 16H16.5C16.7761 16 17 15.7761 17 15.5V13.5C17 13.2239 16.7761 13 16.5 13Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function LinksIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M11 6.00003L9.03552 4.03552C7.65482 2.65482 5.41622 2.65482 4.03552 4.03552C2.65482 5.41622 2.65482 7.65482 4.03552 9.03552L6.00003 11'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M9 14L10.9645 15.9645C12.3452 17.3452 14.5838 17.3452 15.9645 15.9645C17.3452 14.5838 17.3452 12.3452 15.9645 10.9645L14 9'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M12 12L8 8'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function QrIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M16.5 16H18V18H16.5V16Z' fill='currentColor' />
      <path d='M15 14H16.5V16H15V14Z' fill='currentColor' />
      <path d='M16.5 12.5H18V14H16.5V12.5Z' fill='currentColor' />
      <path d='M13 16H15V18H13V16Z' fill='currentColor' />
      <path d='M11 12.5H13V16H11V12.5Z' fill='currentColor' />
      <path d='M13 11H16.5V12.5H13V11Z' fill='currentColor' />
      <path
        d='M6.5 3H4.5C3.67157 3 3 3.67157 3 4.5V6.5C3 7.32843 3.67157 8 4.5 8H6.5C7.32843 8 8 7.32843 8 6.5V4.5C8 3.67157 7.32843 3 6.5 3Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M15.5 3H13.5C12.6716 3 12 3.67157 12 4.5V6.5C12 7.32843 12.6716 8 13.5 8H15.5C16.3284 8 17 7.32843 17 6.5V4.5C17 3.67157 16.3284 3 15.5 3Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M6.5 12H4.5C3.67157 12 3 12.6716 3 13.5V15.5C3 16.3284 3.67157 17 4.5 17H6.5C7.32843 17 8 16.3284 8 15.5V13.5C8 12.6716 7.32843 12 6.5 12Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

const TABS = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: AnalyticsIcon,
    href: '/dashboard/analytics',
  },
  { id: 'links', label: 'Links', icon: LinksIcon, href: '/dashboard/links' },
  {
    id: 'qrcodes',
    label: 'QR codes',
    icon: QrIcon,
    href: '/dashboard/qrcodes',
  },
]

// ─── DashboardNav ───
// Now driven by the real URL via usePathname() instead of local
// click-state — active tab is derived from wherever you actually are,
// and clicking a tab is real navigation (Link), not a state toggle.
// The sliding-pill measurement logic is otherwise unchanged.
export default function DashboardNav() {
  const pathname = usePathname()
  const activeTab =
    TABS.find((t) => pathname?.startsWith(t.href))?.id || 'analytics'

  const tabRefs = useRef({})
  const [pillStyle, setPillStyle] = useState({
    left: 0,
    width: 0,
    ready: false,
  })

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) {
      setPillStyle({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
    }
  }, [activeTab])

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${pillStyle.left}px`,
            width: `${pillStyle.width}px`,
            height: '100%',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            transition: pillStyle.ready
              ? 'left 0.25s cubic-bezier(0.22, 1, 0.36, 1), width 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
            zIndex: 0,
          }}
        />

        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          const Icon = tab.icon

          return (
            <Link
              key={tab.id}
              href={tab.href}
              ref={(el) => (tabRefs.current[tab.id] = el)}
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px 8px 12px',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                color: isActive ? 'var(--text-strong)' : 'var(--text-soft)',
                transition: 'color 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <div
                key={isActive ? `pop-${activeTab}` : tab.id}
                className={isActive ? 'icon-pop' : ''}
                style={{ display: 'flex' }}
              >
                <Icon />
              </div>
              <span
                className={isActive ? 'label-sm' : 'para-sm'}
                style={{ color: 'inherit' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>

      <button
        className='create-new-desktop'
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 20px',
          background: 'var(--text-strong)',
          color: 'var(--bg-default)',
          border: 'none',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
        }}
      >
        <span className='para-sm' style={{ color: 'inherit' }}>
          Create new
        </span>
      </button>
    </div>
  )
}
