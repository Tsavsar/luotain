'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── SettingsNav ───
// Node 87:2714. Two groups of links down the left of the settings pages.
//
// Sections are routes rather than local state: they're deep-linkable, the
// browser's back button behaves, and it matches DashboardNav. It also
// means the active item comes from the URL instead of something we have
// to keep in sync.
//
// Both groups contain a "General", so the label can't identify a section —
// account general is /dashboard/settings, org general is
// /dashboard/settings/organization.
export const SETTINGS_GROUPS = [
  {
    label: 'Account settings',
    items: [
      { label: 'General', href: '/dashboard/settings' },
      {
        label: 'Connected accounts',
        href: '/dashboard/settings/connected-accounts',
      },
      { label: 'Sessions', href: '/dashboard/settings/sessions' },
      {
        label: 'Delete account',
        href: '/dashboard/settings/delete-account',
        danger: true,
      },
    ],
  },
  {
    label: 'Organisation settings',
    items: [
      { label: 'General', href: '/dashboard/settings/organization' },
      { label: 'Usage', href: '/dashboard/settings/usage' },
      { label: 'Team', href: '/dashboard/settings/team' },
      { label: 'Billing', href: '/dashboard/settings/billing' },
      { label: 'Domains', href: '/dashboard/settings/domains' },
      { label: 'API & webhooks', href: '/dashboard/settings/api' },
      {
        label: 'Delete workspace',
        href: '/dashboard/settings/delete-workspace',
        danger: true,
      },
    ],
  },
]

function NavOption({ item, active }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`settings-nav-option${active ? ' is-active' : ''}${item.danger ? ' is-danger' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        // The active pill hangs 10px past the nav's own width on each
        // side, so the highlight has breathing room around the text
        // without the column getting wider. Same trick the table rows use
        // for their hover background.
        margin: '0 -10px',
        padding: '6px 10px',
        boxSizing: 'content-box',
        borderRadius: '8px',
        textDecoration: 'none',
      }}
    >
      <span
        className='para-xs'
        style={{
          flex: '1 0 0',
          minWidth: 0,
          // Destructive items in red. The design has them as plain text
          // like everything else, but "Delete account" sitting
          // indistinguishable from "Sessions" in a list you scan quickly
          // is worth diverging over — it's the one item here that can't be
          // undone.
          color: item.danger ? 'var(--error-base)' : 'var(--text-strong)',
        }}
      >
        {item.label}
      </span>
    </Link>
  )
}

export default function SettingsNav() {
  const pathname = usePathname()

  // Longest match wins, so /dashboard/settings/organization doesn't also
  // light up /dashboard/settings. Exact-match-only would break as soon as
  // a section gains a subpage.
  const activeHref = SETTINGS_GROUPS.flatMap((g) => g.items)
    .map((i) => i.href)
    .filter((href) => pathname === href || pathname?.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]

  return (
    <nav
      aria-label='Settings'
      style={{
        width: '170px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '21px',
        alignItems: 'flex-start',
      }}
    >
      {SETTINGS_GROUPS.map((group) => (
        <div
          key={group.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <p
            style={{
              margin: 0,
              width: '100%',
              // 10px, below the smallest type token — a group heading in a
              // sidebar this narrow, deliberately quiet.
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              lineHeight: 1.3,
              letterSpacing: '0.2px',
              color: 'var(--text-soft)',
            }}
          >
            {group.label}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: '100%',
              background: 'var(--bg-default)',
              borderRadius: '14px',
            }}
          >
            {group.items.map((item) => (
              <NavOption
                key={item.href}
                item={item}
                active={item.href === activeHref}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
