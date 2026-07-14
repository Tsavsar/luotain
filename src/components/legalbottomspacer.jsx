'use client'

// Height now lives in CSS (.legal-bottom-spacer in globals.css) so it
// can be reduced on mobile via media query — mobile hides the sidebar
// entirely, so the "keep sidebar pinned through trailing space" reason
// for a full 100vh doesn't apply there; it only needs enough room for
// the last section to reach the header, which is much less on a
// shorter mobile viewport.
export default function LegalBottomSpacer() {
  return <div aria-hidden='true' className='legal-bottom-spacer' />
}
