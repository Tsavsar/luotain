'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import GeneratedAvatar from './generatedavatar'
import { Dropdown, DropdownOption } from './dropdown'

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
function OrgDropdown({ orgName, allOrgs, activeOrgId }) {
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
      // Full navigation (not just a reload) — lands on the org's
      // main dashboard every time, a predictable spot rather than
      // wherever you happened to be standing when you switched.
      window.location.href = '/dashboard/analytics'
    } catch (err) {
      // silent
    }
  }

  return (
    <Dropdown
      align='center'
      trigger={
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GeneratedAvatar name={orgName} size={24} />
            <p
              className='label-md'
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
            className='dropdown-item'
            style={{
              background:
                org.id === activeOrgId ? 'var(--bg-layer)' : 'transparent',
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
            border: '1px solid var(--stroke-soft)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-default)',
            color: 'var(--text-strong)',
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

  // Clears BOTH possible sessions — the custom app-session cookie
  // (email-code logins) and NextAuth's own session (OAuth logins).
  // A user could be signed in either way, and this doesn't track
  // which, so both get cleared every time to be safe.
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
      <div
        style={{
          background: 'var(--bg-default)',
          border: '1px solid var(--stroke-soft)',
          borderRadius: '14px',
          boxShadow: '0 10px 10px rgba(0, 0, 0, 0.04)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          width: '180px',
        }}
      >
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
        </DropdownOption>{' '}
      </div>
    </Dropdown>
  )
}

export default function DashboardMenu({
  orgName,
  allOrgs,
  activeOrgId,
  userImage,
}) {
  return (
    <div
      style={{
        width: '100%',
        zIndex: 8,
        maxWidth: '720px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href='/dashboard/analytics'>
          <svg
            width='32'
            height='32'
            viewBox='0 0 30 32'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M3.59116 5.45659L11.2741 0.988578C13.5125 -0.313166 16.2804 -0.330419 18.5351 0.943317L26.274 5.31519C28.5287 6.58893 29.9277 8.96015 29.944 11.5356L29.9999 20.3755C30.0161 22.951 28.6473 25.3395 26.4088 26.6412L18.7259 31.1092C18.0545 31.4997 17.3354 31.7746 16.5969 31.9337C15.8429 32.0962 15.2017 31.4694 15.1968 30.7033L15.1787 27.833C15.174 27.0907 15.7874 26.504 16.4687 26.1982C16.5786 26.1488 16.6865 26.0934 16.792 26.0321L22.8942 22.4834C23.9601 21.8635 24.612 20.7261 24.6042 19.4997L24.5598 12.4786C24.5521 11.2522 23.8859 10.1231 22.8122 9.51651L16.6656 6.04414C15.5919 5.4376 14.2739 5.44582 13.208 6.0657L7.10579 9.61442C6.03988 10.2343 5.38802 11.3717 5.39578 12.5981L5.40876 14.6501C5.41355 15.4085 4.79823 16.0271 4.0344 16.0319L1.4106 16.0482C0.646764 16.053 0.0236675 15.4421 0.0188717 14.6837L0.000143737 11.7223C-0.0161435 9.14681 1.35274 6.75833 3.59116 5.45659Z'
              fill='var(--bg-subtle)'
            />
            <path
              d='M14.5066 30.7544C14.5113 31.5015 13.8996 32.1576 13.1722 31.9665C12.5964 31.8152 12.0868 31.5372 11.3826 31.1343L3.668 26.7204C1.42036 25.4345 0.0344782 23.0557 0.0324018 20.4801L0.0328995 18.1078C0.0330574 17.3541 0.656887 16.7413 1.41595 16.7348L4.03974 16.7185C4.80426 16.7133 5.42636 17.328 5.42476 18.0871L5.42166 19.5664C5.42265 20.7929 6.08259 21.9256 7.1529 22.538L13.2803 26.0438C13.9056 26.4016 14.4835 27.0998 14.488 27.8164L14.5066 30.7544Z'
              fill='var(--primary-base)'
            />
          </svg>
        </Link>

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
      </div>

      <ProfileDropdown userImage={userImage} />
    </div>
  )
}
