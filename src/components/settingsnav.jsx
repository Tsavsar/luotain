'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'

// ─── SettingsNav ───
// Node 87:2714. Two groups of links down the left of the settings pages.
//
// Sections are routes rather than local state: they're deep-linkable, the
// browser's back button behaves, and it matches DashboardNav. It also
// means the active item comes from the URL instead of something we have
// to keep in sync.
//
// Both groups contain a "General", so the label can't identify a section —
// account general is /dashboard/settings/general, org general is
// /dashboard/settings/organization.
//
// Account General is NOT the index route, deliberately. On mobile the index
// is the list of sections, and it can't also be a panel — so every section
// including General has its own route and the index is purely the list.
export const SETTINGS_GROUPS = [
  {
    label: 'Account settings',
    items: [
      { label: 'General', href: '/dashboard/settings/general' },
      {
        label: 'Connected accounts',
        href: '/dashboard/settings/connected-accounts',
      },
      { label: 'Sessions', href: '/dashboard/settings/sessions' },
      { label: 'Preferences', href: '/dashboard/settings/preferences' },
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

function ChevronRight() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M6 4l4 4-4 4'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

// The mobile row. Taller, full width, with a chevron — it's a destination
// you tap into, not a tab you switch between, and it needs a real touch
// target rather than the sidebar's 28px.
function ListOption({ item }) {
  return (
    <Link
      href={item.href}
      className='settings-list-option'
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        width: '100%',
        padding: '14px 14px',
        boxSizing: 'border-box',
        borderRadius: '12px',
        textDecoration: 'none',
      }}
    >
      <span
        className='para-sm'
        style={{
          color: item.danger ? 'var(--error-base)' : 'var(--text-strong)',
        }}
      >
        {item.label}
      </span>
      <span
        style={{
          display: 'flex',
          flexShrink: 0,
          color: item.danger ? 'var(--error-base)' : 'var(--text-soft)',
        }}
      >
        <ChevronRight />
      </span>
    </Link>
  )
}

function NavOption({ item, active, innerRef, onHover }) {
  return (
    <Link
      ref={innerRef}
      onMouseEnter={onHover}
      href={item.href}
      aria-current={active ? 'page' : undefined}
      // No is-active class any more — the sliding indicator behind these owns
      // the active background. Leaving both would paint two highlights, one
      // sliding and one appearing instantly underneath it.
      // No className: the indicator behind these owns every background, and
      // the danger colour is set on the label below. A class that styles
      // nothing is a hook someone will later assume is doing something.
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
        // Above the indicator, which sits at zIndex 0 behind the options.
        position: 'relative',
        zIndex: 1,
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

// One group's worth of sidebar options, with a sliding indicator behind the
// active one.
//
// Follows DashboardNav's pattern rather than a parallel one: measure the
// active element's offsetTop/offsetHeight, position an absolute layer, and
// hold transitions off until the first measured paint so it doesn't slide in
// from zero on load.
//
// Per group rather than one for the whole nav, because only one group has an
// active item at a time and a single indicator would have to travel across
// the gap between groups — which reads as the highlight escaping the list.
function SidebarGroup({ group, activeHref }) {
  const itemRefs = useRef({})
  const [pill, setPill] = useState({ top: 0, height: 0, ready: false })
  // Which item the cursor is over, if any. One indicator serves both states:
  // it sits on the active item at rest and follows the cursor on hover,
  // returning when you leave.
  //
  // That's deliberately not two layers. A separate hover highlight on top of
  // the active one means two things visible at once — and the moment you
  // hover the active item itself, they'd sit exactly on top of each other,
  // which reads as a rendering glitch rather than a state.
  const [hovered, setHovered] = useState(null)

  const activeInGroup = group.items.some((i) => i.href === activeHref)
  // Hover wins while it exists, because it's the thing the cursor is
  // pointing at.
  const target = hovered || (activeInGroup ? activeHref : null)

  useLayoutEffect(() => {
    if (!target) return
    const el = itemRefs.current[target]
    if (el) {
      setPill({ top: el.offsetTop, height: el.offsetHeight, ready: true })
    }
  }, [target])

  const targetItem = group.items.find((i) => i.href === target)

  return (
    <div
      // Measured off the hovered element's own rect rather than tracked by
      // index, so it works whatever height a row happens to be — the same
      // approach the dropdowns use.
      onMouseLeave={() => setHovered(null)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '100%',
        background: 'var(--bg-default)',
        borderRadius: '14px',
      }}
    >
      <div
        aria-hidden='true'
        style={{
          position: 'absolute',
          // Matches the options' own negative margin, so the indicator lines
          // up with their padded box rather than the text.
          left: '-10px',
          right: '-10px',
          top: `${pill.top}px`,
          height: `${pill.height}px`,
          borderRadius: '8px',
          // Danger items tint red, so the destructive ones stay
          // distinguishable at the moment the cursor is on them.
          background: targetItem?.danger
            ? 'var(--error-mute)'
            : 'var(--bg-surface)',
          opacity: target ? 1 : 0,
          transition: pill.ready
            ? 'top var(--duration-modal) var(--ease-out), height var(--duration-modal) var(--ease-out), opacity var(--duration-fast) ease, background var(--duration-fast) ease'
            : 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {group.items.map((item) => (
        <NavOption
          key={item.href}
          item={item}
          active={item.href === activeHref}
          onHover={() => setHovered(item.href)}
          innerRef={(el) => {
            if (el) itemRefs.current[item.href] = el
            else delete itemRefs.current[item.href]
          }}
        />
      ))}
    </div>
  )
}

export default function SettingsNav({ variant = 'sidebar' }) {
  const pathname = usePathname()
  const isList = variant === 'list'

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
        width: isList ? '100%' : '170px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: isList ? '24px' : '21px',
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
          {isList ? (
            <p
              className='para-xs'
              style={{ margin: 0, width: '100%', color: 'var(--text-soft)' }}
            >
              {group.label}
            </p>
          ) : (
            <p
              style={{
                margin: 0,
                width: '100%',
                // 10px, below the smallest type token — a group heading in a
                // sidebar this narrow, deliberately quiet. On mobile it goes
                // up to para-xs, where there's room and 10px would be
                // needlessly hard to read.
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                lineHeight: 1.3,
                letterSpacing: '0.2px',
                color: 'var(--text-soft)',
              }}
            >
              {group.label}
            </p>
          )}

          {isList ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
                // The list gets a surface and dividers so the rows read as
                // one grouped control rather than floating text.
                background: 'var(--bg-surface)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              {group.items.map((item, i) => (
                <div key={item.href} style={{ width: '100%' }}>
                  {i > 0 ? (
                    <div
                      aria-hidden='true'
                      style={{
                        height: '1px',
                        // Inset so the divider doesn't run into the rounded
                        // corners of the group.
                        margin: '0 14px',
                        background: 'var(--stroke-soft)',
                      }}
                    />
                  ) : null}
                  <ListOption item={item} />
                </div>
              ))}
            </div>
          ) : (
            <SidebarGroup group={group} activeHref={activeHref} />
          )}
        </div>
      ))}
    </nav>
  )
}
