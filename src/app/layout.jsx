import { Analytics } from '@vercel/analytics/next'
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

//
// This had to be added for any theme to survive a reload. `data-theme='light'`
// was hardcoded on <html> and nothing re-applied the stored value on load, so
// picking Dark worked until you refreshed and then silently reverted. The
//
// It's a blocking inline script rather than an effect on purpose: an effect runs
// after the first paint, so a dark theme would flash white first. This
// is the one case where a synchronous script in <head> is the right tool.
//
// 'system' is stored as the literal string and clears the attribute, which lets
// the CSS fall through to prefers-color-scheme — a missing key can't be told
// apart from a first visit, which is why it isn't stored as an absence.
// Runs before first paint, so the page never renders in one theme and swaps.
//
// The important part is the fallback: no stored choice means LIGHT, not the
// system preference. Following the OS by default threw anyone with a dark
// system into a theme they never picked on a first visit.
//
// "system" is now an explicit choice like the other two, and it's the only
// value the prefers-color-scheme query in globals.css responds to.
const THEME_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark' || t === 'system') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {
    // Private browsing throws on localStorage. Light rather than nothing —
    // an unset attribute is the same as light now, but being explicit means
    // this can't drift if that ever changes.
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

export default function RootLayout({ children }) {
  return (
    // data-theme is set by the script below rather than here — hardcoding it
    // would mean the script has to fight the server-rendered value.
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
        {/* Last in the body, after the app. It injects a script tag and
            nothing renders around it, so putting it earlier would only delay
            the content people came for.
            
            In the ROOT layout rather than the dashboard's, so the landing page
            and the legal pages are counted too — those are where anyone
            arriving from outside lands first. */}
        <Analytics />
      </body>
    </html>
  )
}