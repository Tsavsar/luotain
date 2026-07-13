import LegalHeader from '@/components/legalheader'

// ─── Shared layout for /terms and /privacy ───
// Header sits in its own fixed-height zone that NEVER scrolls.
// Everything below it (sidebar + content, rendered by each page)
// lives in a separate flex:1 zone — that's the only thing that scrolls.
// This is what stops the whole page from "flipping" when you click
// a sidebar link: the header can't move because it's structurally
// outside the scrollable area, not just visually on top of it.
export default function LegalLayout({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Header zone — fixed, never scrolls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '80px 24px 0',
          flexShrink: 0,
        }}
      >
        <LegalHeader />
      </div>

      {/* Everything below — page.jsx renders its own scrollable area inside here */}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  )
}
