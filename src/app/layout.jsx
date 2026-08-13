import AuthProvider from '@/components/authprovider'
import './globals.css'

export const metadata = {
  title: 'Luotain',
  description: 'Shortlink and QR code generator',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Applies the saved theme BEFORE the first paint.
//
// This had to be added for any theme to survive a reload. `data-theme='light'`
// was hardcoded on <html> and nothing re-applied the stored value on load, so
// picking Dark worked until you refreshed and then silently reverted. The
// preferences page's effect only set its own picker state, not the attribute.
//
// It's a blocking inline script rather than an effect on purpose: an effect runs
// after the first paint, so a dark theme would flash white first. This
// is the one case where a synchronous script in <head> is the right tool.
//
// 'system' is stored as the literal string and clears the attribute, which lets
// the CSS fall through to prefers-color-scheme — a missing key can't be told
// apart from a first visit, which is why it isn't stored as an absence.
const THEME_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch (e) {}
})();
`

export default function RootLayout({ children }) {
  return (
    // No data-theme here. With one hardcoded, the script below would have to
    // fight it, and 'system' could never fall through to the media query.
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1'
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
