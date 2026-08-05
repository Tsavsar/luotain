'use client'

import { useParams } from 'next/navigation'
import { SETTINGS_GROUPS } from '@/components/settingsnav'

// ─── Settings → not built yet ───
// A catch-all under /dashboard/settings, so the nav items whose sections
// don't exist yet lead somewhere honest instead of a 404.
//
// This matters more than it looks: the nav lists eleven sections and only
// three have pages, so without this, eight of them were dead links. That's
// what "this page couldn't load" was.
//
// Next.js prefers a specific route over a catch-all, so adding
// /dashboard/settings/team/page.jsx later takes over from this
// automatically — nothing here needs updating as sections get built.
export default function SettingsSectionPlaceholder() {
  const params = useParams()
  const segments = Array.isArray(params?.section)
    ? params.section
    : [params?.section].filter(Boolean)
  const path = `/dashboard/settings/${segments.join('/')}`

  // Named from the nav rather than de-slugged from the URL, so the heading
  // matches the item that was clicked ("API & webhooks", not "Api Webhooks").
  const match = SETTINGS_GROUPS.flatMap((g) => g.items).find(
    (i) => i.href === path
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        {match ? match.label : 'Settings'}
      </p>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '56px 20px',
          background: 'var(--bg-surface)',
          borderRadius: '14px',
          boxSizing: 'border-box',
        }}
      >
        <p
          className='para-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          Not built yet
        </p>
        <p
          className='para-xs'
          style={{ color: 'var(--text-soft)', margin: 0, textAlign: 'center' }}
        >
          {match
            ? `${match.label} is designed but has no panel behind it yet.`
            : 'This settings section does not exist.'}
        </p>
      </div>
    </div>
  )
}
