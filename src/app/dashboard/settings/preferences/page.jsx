'use client'

import { useEffect, useRef, useState } from 'react'
import Switch from '@/components/switch'
import SegmentedTabs from '@/components/segmentedtabs'
import { Dropdown, DropdownMenu, DropdownOption } from '@/components/dropdown'
import Inputfield from '@/components/input'
import { toast } from '@/components/toast'
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
      <p
        className='para-xs'
        style={{ color: 'var(--text-soft)', margin: '0 0 4px 0' }}
      >
        {title}
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          // Dividers between rows rather than a card each — a settings list is
          // one object, and nine bordered boxes read as nine unrelated ones.
          borderTop: '1px solid var(--stroke-soft)',
        }}
      >
        {children}
      </div>
    </div>
  )
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
  const [prefs, setPrefs] = useState(null)
  const [theme, setTheme] = useState('light')
  const saveTimer = useRef(null)

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  useEffect(() => {
    // Theme is read from localStorage, not the API — it has to apply before
    // first paint or the page flashes the wrong colours, and a request can't
    // happen that early. This surfaces the same local value the toggle uses
    // rather than introducing a second source of truth.
    try {
      setTheme(localStorage.getItem('theme') || 'light')
    } catch {}

    let cancelled = false
    fetch('/api/me/preferences')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (!cancelled) setPrefs(d?.preferences || { ...DEFAULT_PREFERENCES })
      })
      .catch((err) => {
        console.error('[Preferences]', err)
        if (!cancelled) setPrefs({ ...DEFAULT_PREFERENCES })
      })
    return () => {
      cancelled = true
    }
  }, [])

  function applyTheme(next) {
    setTheme(next)
    try {
      if (next === 'system') {
        // The attribute removed rather than set, so the CSS falls back to
        // prefers-color-scheme — which is what "system" means.
        document.documentElement.removeAttribute('data-theme')
        localStorage.removeItem('theme')
      } else {
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('theme', next)
      }
    } catch {}
  }

  // Optimistic, then persisted. A switch that waits for a round trip before
  // moving feels broken on a slow connection; reverting on failure is the
  // honest version of that trade.
  function update(patch) {
    const previous = prefs
    setPrefs((p) => ({ ...p, ...patch }))

    fetch('/api/me/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || `Save failed (${res.status})`)
        }
      })
      .catch((err) => {
        console.error('[Preferences]', err)
        setPrefs(previous)
        toast.error("Couldn't save that preference")
      })
  }

  if (!prefs) {
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
        <Row label='Theme' description='System follows your device setting.'>
          <SegmentedTabs
            items={[
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
              { id: 'system', label: 'System' },
            ]}
            activeId={theme}
            onChange={applyTheme}
            padX='12px'
          />
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
                  value={formatTimezone(prefs.timezone)}
                  onChange={() => {}}
                  placeholder=''
                />
              }
            >
              <DropdownMenu width='240px'>
                {zones.map((tz) => (
                  <DropdownOption
                    key={tz}
                    selected={tz === prefs.timezone}
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
            checked={prefs.emailWeeklyDigest}
            onChange={() =>
              update({ emailWeeklyDigest: !prefs.emailWeeklyDigest })
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
            checked={prefs.emailTrafficAlerts}
            onChange={() =>
              update({ emailTrafficAlerts: !prefs.emailTrafficAlerts })
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
            checked={prefs.emailProductUpdates}
            onChange={() =>
              update({ emailProductUpdates: !prefs.emailProductUpdates })
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
            checked={prefs.defaultQrBranding}
            onChange={() =>
              update({ defaultQrBranding: !prefs.defaultQrBranding })
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
            checked={prefs.copyWithScheme}
            onChange={() => update({ copyWithScheme: !prefs.copyWithScheme })}
          />
        </Row>
      </Group>
    </div>
  )
}
