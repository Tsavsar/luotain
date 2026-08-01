'use client'

import BackButton from '@/components/backbutton'
import SettingsNav from '@/components/settingsnav'

// ─── Settings layout ───
// The nav and the Back button live here rather than in each section, so
// they don't remount as you move between sections — the sidebar stays put
// and only the panel on the right changes.
//
// Nested under the dashboard layout, so the header, the auth check and the
// mock-data provider all still apply.
export default function SettingsLayout({ children }) {
  return (
    <div
      className='dashboard-section dashboard-section-3 dashboard-page-padding'
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        // 0 — the dashboard header already carries 24px below it. Anything
        // here stacks on top of that.
        paddingTop: 0,
        paddingBottom: '64px',
      }}
    >
      <div
        className='settings-shell'
        style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          // 46px: the design's sidebar ends at 530 and the panel starts at
          // 576 within a 720 column.
          gap: '46px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '21px',
            flexShrink: 0,
          }}
        >
          <BackButton />
          <SettingsNav />
        </div>

        {/* min-width 0 so a long value inside can ellipsis rather than
            forcing the whole panel wider and squeezing the sidebar. */}
        <div style={{ flex: '1 0 0', minWidth: 0 }}>{children}</div>
      </div>
    </div>
  )
}
