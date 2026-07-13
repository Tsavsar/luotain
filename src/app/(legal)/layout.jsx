import LegalHeader from '@/components/legalheader'

// ─── Shared layout for /terms and /privacy ───
// Wraps both pages so LegalHeader (tabs + title) stays mounted
// when navigating between them — required for the sliding pill
// and text-reveal animations to actually be visible.
export default function LegalLayout({ children }) {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px 120px',
      }}
    >
      <LegalHeader />
      {children}
    </main>
  )
}
