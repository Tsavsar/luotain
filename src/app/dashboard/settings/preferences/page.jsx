'use client'

import { useEffect, useRef, useState } from 'react'
import Switch from '@/components/switch'
import ThemePreview from '@/components/themepreview'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import Inputfield from '@/components/input'
import { toast } from '@/components/toast'
import SaveBar from '@/components/savebar'
import {
  useUnsavedChanges,
  UnsavedBanner,
} from '@/components/unsavedchanges'
import {
  DEFAULT_PREFERENCES,
  COMMON_TIMEZONES,
  formatTimezone,
  isValidTimezone,
} from '@/lib/preferences'

// ─── Account → Preferences ───
//
// Saved on change rather than behind a Save button. A toggle that needs
// confirming reads as broken — you flip it, nothing happens, and you have to
// find the button. The General page has a Save because a half-typed name
// shouldn't persist; a switch has no half state.

function Row({ label, description, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        width: '100%',
        padding: '14px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          minWidth: 0,
        }}
      >
        <p
          className='para-sm'
          style={{ color: 'var(--text-strong)', margin: 0 }}
        >
          {label}
        </p>
        {description ? (
          <p
            className='para-xs'
            style={{ color: 'var(--text-soft)', margin: 0 }}
          >
            {description}
          </p>
        ) : null}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <div style={{ width: '100%' }}>
      <p className='para-xs' style={{ color: 'var(--text-soft)', margin: 0 }}>
        {title}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function formatLastUpdated(iso) {
  if (!iso) return 'Never'
  const then = new Date(iso)
  const mins = Math.floor((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return then.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ChevronIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M4 6.5 8 10.5l4-4'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default function PreferencesPage() {
  // Staged, like the General page: `draft` is what's on screen, `saved` is what
  // the server holds, and Save persists the difference.
  //
  // This replaced save-on-change. I'd argued the other way — a switch has no half
  // state, so there's nothing to confirm — but with seven preferences on one
  // screen batching wins: one request instead of seven, and Discard becomes
  // possible, which save-on-change can't offer at all.
  const [draft, setDraft] = useState(null)
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState('light')

  // Theme is deliberately NOT staged. You change it to see it — a theme behind a
  // Save button would mean picking Dark and nothing happening.
  // Compared against the known preference keys, not every key on the object.
  // `updatedAt` rides along in the same blob and is set by the server, so
  // including it would work today (both copies match after a load) but break the
  // moment anything else touched it.
  const dirty =
    Boolean(draft && saved) &&
    Object.keys(DEFAULT_PREFERENCES).some((k) => draft[k] !== saved[k])

  useEffect(() => {
    // Theme is read from localStorage, not the API — it has to apply before
    // first paint or the page flashes the wrong colours, and a request can't
    // happen that early. This surfaces the same local value the toggle uses
    // rather than introducing a second source of truth.
    try {
      // Defaults to 'system' when nothing is stored, not 'light'. It used to
      // fall back to light, which meant someone who picked System saw Light
      // selected after every reload — System was stored as a MISSING key, so it
      // was indistinguishable from a first visit. It's stored explicitly now.
      const saved = localStorage.getItem('theme')
      // Light when nothing is stored. Someone who has never opened this page
      // hasn't chosen to follow their system, and defaulting to System put
      // anyone with a dark OS into a theme they didn't pick.
      setTheme(
        saved === 'light' || saved === 'dark' || saved === 'system'
          ? saved
          : 'light'
      )
    } catch {}

    let cancelled = false
    fetch('/api/me/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (cancelled) return
        const next = d?.preferences || { ...DEFAULT_PREFERENCES }
        setDraft(next)
        setSaved(next)
      })
      .catch((err) => {
        console.error('[Preferences]', err)
        if (cancelled) return
        setDraft({ ...DEFAULT_PREFERENCES })
        setSaved({ ...DEFAULT_PREFERENCES })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const { warnOpen, warnShaking } = useUnsavedChanges(
    dirty,
    '/dashboard/settings/preferences'
  )

  function applyTheme(next) {
    setTheme(next)
    try {
        // 'system' is an attribute VALUE now, not the absence of one. The
        // prefers-color-scheme rule in globals.css matches
        // [data-theme='system'] specifically — removing the attribute would
        // now fall through to light, which is the new default.
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('theme', next)
    } catch {}
  }

  // Local only. Nothing leaves the page until Save.
  function update(patch) {
    setDraft((d) => ({ ...d, ...patch }))
  }

  function discard() {
    setDraft(saved)
  }

  async function handleSave() {
    if (!dirty || saving) return
    setSaving(true)
    try {
      // Only what changed, so a save can't overwrite a preference this tab never
      // touched — the endpoint merges rather than replaces.
      const patch = {}
      for (const key of Object.keys(DEFAULT_PREFERENCES)) {
        if (draft[key] !== saved[key]) patch[key] = draft[key]
      }

      const res = await fetch('/api/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error || `Couldn't save preferences (${res.status})`)
        return
      }

      setDraft(data.preferences)
      setSaved(data.preferences)
      toast('Preferences saved')
    } catch (err) {
      console.error('[Preferences]', err)
      toast.error("Couldn't save preferences")
    } finally {
      setSaving(false)
    }
  }

  if (!draft) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
        }}
      >
        <div
          className='skeleton-pulse'
          style={{
            width: '104px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
          }}
        />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className='skeleton-pulse'
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
            }}
          />
        ))}
      </div>
    )
  }

  // The browser's own zone, offered first so most people never open the list.
  const guessed = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      return tz && isValidTimezone(tz) && !COMMON_TIMEZONES.includes(tz)
        ? tz
        : null
    } catch {
      return null
    }
  })()
  const zones = guessed ? [guessed, ...COMMON_TIMEZONES] : COMMON_TIMEZONES

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <p
        className='label-sm'
        style={{ color: 'var(--text-strong)', margin: 0 }}
      >
        Preferences
      </p>

      <Group title='Appearance'>
        {/* Same Row as every other setting, so this reads as one list rather
            than one list plus a special case. The cards come to ~216px, which
            fits beside the label in the 720px column. */}
        <Row label='Theme' description='System follows your device setting.'>
          <ThemePreview value={theme} onChange={applyTheme} />
        </Row>
      </Group>

      <Group title='Analytics'>
        <Row
          label='Timezone'
          // Spelled out because it isn't obvious: this changes what counts as a
          // day, so the same clicks can move between dates.
          description='Clicks are grouped by day in this timezone.'
        >
          <div style={{ width: '200px' }}>
            <Dropdown
              fullWidth
              align='right'
              trigger={
                <Inputfield
                  righticon={<ChevronIcon />}
                  textSize='12px'
                  value={formatTimezone(draft.timezone)}
                  onChange={() => {}}
                  placeholder=''
                />
              }
            >
              <DropdownMenu>
                {zones.map((tz) => (
                  <DropdownOption
                    key={tz}
                    selected={tz === draft.timezone}
                    onClick={() => update({ timezone: tz })}
                  >
                    {formatTimezone(tz)}
                  </DropdownOption>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </Row>
      </Group>

      <Group title='Email'>
        <Row
          label='Weekly digest'
          description='How your links performed, once a week.'
        >
          <Switch
            size='sm'
            hideLabel
            label='Weekly digest'
            checked={draft.emailWeeklyDigest}
            onChange={() =>
              update({ emailWeeklyDigest: !draft.emailWeeklyDigest })
            }
          />
        </Row>
        <Row
          label='Traffic alerts'
          description='When a link gets unusual traffic, up or down.'
        >
          <Switch
            size='sm'
            hideLabel
            label='Traffic alerts'
            checked={draft.emailTrafficAlerts}
            onChange={() =>
              update({ emailTrafficAlerts: !draft.emailTrafficAlerts })
            }
          />
        </Row>
        <Row
          label='Product updates'
          description='New features and occasional news. No more than monthly.'
        >
          <Switch
            size='sm'
            hideLabel
            label='Product updates'
            checked={draft.emailProductUpdates}
            onChange={() =>
              update({ emailProductUpdates: !draft.emailProductUpdates })
            }
          />
        </Row>
      </Group>

      <Group title='Defaults'>
        <Row
          label='Brand new QR codes'
          description='Adds the Luotain mark to codes you create.'
        >
          <Switch
            size='sm'
            hideLabel
            label='Brand new QR codes'
            checked={draft.defaultQrBranding}
            onChange={() =>
              update({ defaultQrBranding: !draft.defaultQrBranding })
            }
          />
        </Row>
        <Row
          label='Copy links with https://'
          description='Off copies luot.link/abc instead.'
        >
          <Switch
            size='sm'
            hideLabel
            label='Copy links with https://'
            checked={draft.copyWithScheme}
            onChange={() => update({ copyWithScheme: !draft.copyWithScheme })}
          />
        </Row>
      </Group>

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onDiscard={discard}
      />

      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          Last updated:
        </span>
        <span className='para-xs' style={{ color: 'var(--text-strong)' }}>
          {formatLastUpdated(saved?.updatedAt)}
        </span>
      </div>
    </div>
  )
}