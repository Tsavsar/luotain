'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import GeneratedAvatar from './generatedavatar'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import LogoMark from './logomark'

function OrgChevronIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M13 7L10 4L7 7'
        stroke='var(--text-soft)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M13 13L10 16L7 13'
        stroke='var(--text-soft)'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M10 4V16M4 10H16'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// ─── OrgDropdown ───
// Matches Figma node 72:1957, now with real multi-org support. Lists
// every org the user belongs to, active one highlighted. Switching
// hits /api/switch-org (which re-verifies membership server-side —
// never trusts the client), then does a full reload so every piece
// of dashboard data reflects the newly active org consistently,
// rather than trying to selectively refetch each piece.
function OrgDropdown({ orgName, allOrgs = [], activeOrgId }) {
  const router = useRouter()

  async function handleSwitch(orgId) {
    if (orgId === activeOrgId) return
    try {
      const res = await fetch('/api/switch-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      if (!res.ok) return
      window.location.href = '/dashboard/analytics'
    } catch (err) {
      // silent
    }
  }

  return (
    <Dropdown
      sideOffset={-20}
      offsetX={16}
      triggerHover
      trigger={
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GeneratedAvatar name={orgName} size={24} />
            {/* Hidden on mobile via CSS — keeps just the avatar +
                chevron in the compact top row */}
            <p
              className='label-md org-name-text'
              style={{ color: 'var(--text-strong)', margin: 0 }}
            >
              {orgName}
            </p>
          </div>
          <OrgChevronIcon />
        </div>
      }
    >
      <div
        style={{
          background: 'var(--bg-default)',
          border: '1px solid var(--stroke-soft)',
          borderRadius: 'var(--radius-lg)',
          boxShadow:
            '0 5px 13px -5px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '260px',
        }}
      >
        {allOrgs.map((org) => (
          <div
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className={`org-row${org.id === activeOrgId ? ' is-active' : ''}`}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '10px 10px 10px 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <GeneratedAvatar name={org.name} size={20} />
            <p
              className='para-sm'
              style={{ color: 'var(--text-strong)', margin: 0, flex: 1 }}
            >
              {org.name}
            </p>
          </div>
        ))}

        <button
          onClick={() => router.push('/new-org?from=dashboard')}
          className='dropdown-item'
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '36px',
            padding: '6px 8px 6px 12px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-layer)',
            color: 'var(--text-strong)',
            justifyContent: 'center',
          }}
        >
          <PlusIcon />
          <span className='para-sm' style={{ color: 'inherit' }}>
            New organisation
          </span>
        </button>
      </div>
    </Dropdown>
  )
}

// ─── ProfileDropdown ─── matches Figma node 87:2323
function ProfileDropdown({ userImage }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <Dropdown
      align='right'
      trigger={
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--bg-subtle)',
          }}
        >
          {userImage && (
            <img
              src={userImage}
              alt=''
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      }
    >
      <DropdownMenu width='180px'>
        <DropdownOption onClick={() => router.push('/dashboard/settings')}>
          Settings
        </DropdownOption>
        <DropdownOption onClick={() => router.push('/dashboard/billing')}>
          Upgrade plan
        </DropdownOption>
        <DropdownOption onClick={() => router.push('/dashboard/contact')}>
          Contact
        </DropdownOption>
        <DropdownOption onClick={handleLogout} danger>
          Log out
        </DropdownOption>
      </DropdownMenu>
    </Dropdown>
  )
}

// `compact` strips this back to the logo and the profile — no org
// switcher, no Create new — for focused single-task pages like create.
// `maxWidth` comes from the caller so the header lines up with whatever
// that page's content column is: 720px normally, 440px on create.
//
// Same component rather than a separate compact header because the
// profile still has to be the real ProfileDropdown (settings, logout),
// and the logo still has to link home. A stripped-down copy would be
// two of each to keep in sync.
export default function DashboardMenu({
  orgName,
  allOrgs,
  activeOrgId,
  userImage,
  compact = false,
  maxWidth = '720px',
}) {
  const router = useRouter()
  return (
    <div
      style={{
        width: '100%',
        zIndex: 8,
        maxWidth,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // The layout keeps this mounted across navigation, so going to
        // create actually animates the collapse from 720 to 440 rather
        // than snapping to it.
        transition: 'max-width 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href='/dashboard/analytics'>
          <LogoMark size={32} />
        </Link>

        {!compact && (
          <>
            <div
              style={{
                width: '1.5px',
                height: '20px',
                background: 'var(--bg-layer)',
                borderRadius: '19px',
              }}
            />

            <OrgDropdown
              orgName={orgName}
              allOrgs={allOrgs}
              activeOrgId={activeOrgId}
            />
          </>
        )}
      </div>

      {/* Right side: on mobile, Create New sits before the pfp too —
          hidden on desktop since DashboardNav already has its own
          copy there */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!compact && (
          <button
            onClick={() => router.push('/dashboard/create')}
            className='create-new-mobile'
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
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
        )}

        <ProfileDropdown userImage={userImage} />
      </div>
    </div>
  )
}
