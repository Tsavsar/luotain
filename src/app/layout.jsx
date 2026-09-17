import { Analytics } from '@vercel/analytics/next'
import AuthProvider from '@/components/authprovider'
import './globals.css'

// metadataBase is what makes the relative image path below resolve to an
// absolute URL. Without it Next emits a relative og:image, and every scraper
// ignores it — which is the usual reason an OG image "doesn't work".
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://luotain.app'

const TITLE = 'Luotain'
const DESCRIPTION =
  'Short links and QR codes that carry their own analytics. Change where a printed code points, any time.'

export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE,
    siteName: TITLE,
    type: 'website',
    images: [
      {
        url: '/assets/og-image.png',
        // Declared explicitly. Several scrapers reserve the space before the
        // image downloads, and without dimensions they guess, so the card
        // reflows or crops.
        width: 1200,
        height: 630,
        alt: 'Luotain, short links and QR codes with analytics',
      },
    ],
  },
  twitter: {
    // summary_large_image, not summary: the small card crops to a square and
    // a 1200x630 image loses most of itself.
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/assets/og-image.png'],
  },
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
