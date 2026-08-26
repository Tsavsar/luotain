'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Dropdown, DropdownMenu, DropdownOption } from './dropdown'
import LogoMark from './logomark'
import GradientAvatar, { seedFor } from './gradientavatar'
import PlanBadge from './planbadge'
import PlanCard from './plancard'

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
// Photo if there is one, gradient otherwise. Both places that show an org
// avatar were calling GradientAvatar directly with only a name, so an uploaded
// picture was never rendered anywhere in the header.
function OrgAvatar({ image, name, seed, id, size }) {
  if (image) {
    return (
      <img
        src={image}
        alt=''
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: 'var(--radius-full)',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <GradientAvatar
      seed={seedFor({ seed, id, name })}
      name={name}
      size={size}
    />
  )
}

function OrgDropdown({
  orgName,
  orgImage,
  orgAvatarSeed,
  allOrgs = [],
  activeOrgId,
}) {
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
            <OrgAvatar
              image={orgImage}
              name={orgName}
              seed={orgAvatarSeed}
              id={activeOrgId}
              size={24}
            />
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
            <OrgAvatar
              image={org.image}
              name={org.name}
              seed={org.avatarSeed}
              id={org.id}
              size={20}
            />
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
function ProfileDropdown({ userImage, userName, avatarSeed }) {
  const [plansOpen, setPlansOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <>
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
            }}
          >
            {userImage ? (
              <img
                src={userImage}
                alt=''
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              // Was a flat --bg-subtle circle, which read as a missing image.
              // Same gradient as the settings page, from the same seed, so
              // the avatar is consistent wherever it appears.
              <GradientAvatar seed={avatarSeed} name={userName} size={32} />
            )}
          </div>
        }
      >
        <DropdownMenu width='180px'>
          <DropdownOption
            onClick={() =>
              // ?from= tells the settings page where to return to. Without it
              // its Back button has nothing to go to but the dashboard, since
              // it deliberately doesn't walk browser history — moving between
              // settings sections would otherwise make Back step through the
              // tabs instead of leaving.
              router.push(
                `/dashboard/settings?from=${encodeURIComponent(pathname || '/dashboard/analytics')}`
              )
            }
          >
            Settings
          </DropdownOption>
          <DropdownOption onClick={() => setPlansOpen(true)}>
            Upgrade plan
          </DropdownOption>
          <DropdownOption
            onClick={() => router.push('/dashboard/settings/contact')}
          >
            Contact
          </DropdownOption>
          {/* Above Log out, below the account items — it's a way OUT of the
                app rather than an account action, and grouping it with Settings
                and Upgrade would suggest it's one.
                
                A plain push, not a new tab: it's the same site, and forcing a
                tab on someone who only wanted the pricing page leaves them
                with two copies of the app open. */}
          <DropdownOption onClick={() => router.push('/')}>
            Go to website
          </DropdownOption>
          <DropdownOption onClick={handleLogout} danger>
            Log out
          </DropdownOption>
        </DropdownMenu>
      </Dropdown>

      {/* Mounted alongside the dropdown rather than inside it — the dropdown
          unmounts its panel on close, which would take the card with it the
          instant the menu item was clicked. */}
      <PlanCard open={plansOpen} onClose={() => setPlansOpen(false)} />
    </>
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
  orgImage,
  orgAvatarSeed,
  allOrgs,
  activeOrgId,
  userImage,
  userName,
  avatarSeed,
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
        transition: 'max-width 0.3s var(--ease-out)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href='/dashboard/analytics'>
          <LogoMark size={32} />
        </Link>

        {/* Collapsed rather than unmounted. This is what made the header
            collapse look like it only worked from some pages: the width was
            animating everywhere, but the org switcher and divider VANISHED in a
            single frame at the same time. Coming from a page with the nav row
            showing, there was enough else moving to cover it; coming from a page
            where the nav was already hidden, the instant disappearance was the
            only thing you saw and it read as a snap rather than a collapse.

            Kept mounted and collapsed to zero width instead, so the same
            animation plays from every page. max-width rather than width because
            the org name's length varies — a fixed target would either clip long
            names or leave a gap after short ones. */}
        <div
          aria-hidden={compact}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflow: 'hidden',
            maxWidth: compact ? '0px' : '320px',
            opacity: compact ? 0 : 1,
            // Not focusable while collapsed — a zero-width dropdown that can
            // still be tabbed into is worse than one that's gone.
            pointerEvents: compact ? 'none' : 'auto',
            transition:
              'max-width 0.3s var(--ease-out), opacity 0.2s var(--ease-out)',
          }}
        >
          <div
            style={{
              width: '1.5px',
              height: '20px',
              flexShrink: 0,
              background: 'var(--bg-layer)',
              borderRadius: '19px',
            }}
          />

          <OrgDropdown
            orgName={orgName}
            orgImage={orgImage}
            orgAvatarSeed={orgAvatarSeed}
            allOrgs={allOrgs}
            activeOrgId={activeOrgId}
          />
        </div>
      </div>

      {/* Right side: on mobile, Create New sits before the pfp too —
          hidden on desktop since DashboardNav already has its own
          copy there */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Collapsed, not unmounted, for the same reason as the org switcher —
            this is the mobile counterpart, and it disappearing in one frame was
            the other half of the snap. */}
        <div
          aria-hidden={compact}
          className='create-new-mobile-wrap'
          style={{
            overflow: 'hidden',
            maxWidth: compact ? '0px' : '160px',
            opacity: compact ? 0 : 1,
            pointerEvents: compact ? 'none' : 'auto',
            transition:
              'max-width 0.3s var(--ease-out), opacity 0.2s var(--ease-out)',
          }}
        >
          <button
            onClick={() => router.push('/dashboard/create')}
            className='create-new-mobile'
            tabIndex={compact ? -1 : 0}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              background: 'var(--text-strong)',
              color: 'var(--bg-default)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span className='para-sm' style={{ color: 'inherit' }}>
              Create new
            </span>
          </button>
        </div>

        {/* Left of the avatar, in the header rather than pinned to a corner.
            A plan is a property of the account, so it belongs where the account
            lives — floating bottom right it read as an overlay on the page it
            happened to be covering. */}
        <PlanBadge />

        <ProfileDropdown
          userImage={userImage}
          userName={userName}
          avatarSeed={avatarSeed}
        />
      </div>
    </div>
  )
}
