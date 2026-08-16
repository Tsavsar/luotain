import { prisma } from '@/lib/prisma'

// ─── The redirect ───
// The thing every short link and QR code actually hits. Without it a link is a
// row in a database that resolves to nothing, and the analytics dashboard has
// no source of data at all.
//
// A route handler rather than a page: this never renders, it looks something up
// and returns a 302. A page would ship React to a visitor who's leaving.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Paths that belong to the app. Next gives a static segment priority over a
// dynamic one, so /login already wins — this is a second line of defence for
// anything added later, and it stops someone claiming a slug that would shadow
// a real page.
const RESERVED = new Set([
  'api',
  'dashboard',
  'login',
  'logout',
  'get-started',
  'onboarding',
  'invite',
  'new-org',
  'verification-code',
  'terms',
  'privacy',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  '_next',
])

// Coarse on purpose. A full UA-parsing library is a large dependency and a
// maintenance burden for three buckets, and the analytics only ever groups by
// these.
function deviceFrom(ua = '') {
  const s = ua.toLowerCase()
  if (/ipad|tablet|playbook|silk/.test(s)) return 'Tablet'
  if (/mobi|iphone|android|phone/.test(s)) return 'Mobile'
  return 'Desktop'
}

function browserFrom(ua = '') {
  const s = ua.toLowerCase()
  // Order matters: Edge and Opera both claim Chrome, and Chrome claims Safari.
  if (s.includes('edg/')) return 'Edge'
  if (s.includes('opr/') || s.includes('opera')) return 'Opera'
  if (s.includes('chrome')) return 'Chrome'
  if (s.includes('firefox')) return 'Firefox'
  if (s.includes('safari')) return 'Safari'
  return 'Other'
}

// The source domain, not the full URL. A referrer path can carry query strings
// and personal data, and the analytics only groups by host.
function referrerFrom(header) {
  if (!header) return null
  try {
    const host = new URL(header).hostname.replace(/^www\./, '')
    return host || null
  } catch {
    return null
  }
}

export async function GET(request, { params }) {
  const { shortCode } = await params

  if (!shortCode || RESERVED.has(shortCode.toLowerCase())) {
    return new Response('Not found', { status: 404 })
  }

  // The hostname decides WHICH link. The same slug can exist on luot.link and
  // on a customer's own domain, and they're different links — resolving by slug
  // alone would send a visitor to whichever happened to be created first.
  const url = new URL(request.url)
  const hostname = (request.headers.get('x-forwarded-host') || url.hostname)
    .split(':')[0]
    .toLowerCase()

  try {
    const domain = await prisma.domain.findUnique({
      where: { hostname },
      select: { id: true },
    })
    if (!domain) return new Response('Not found', { status: 404 })

    // A QR code and a link share one slug namespace on a domain, so both are
    // checked.
    //
    // The QR lookup is wrapped SEPARATELY. It used to sit in the same try as
    // everything else, so if it threw — a missing migration, a constraint that
    // doesn't exist in the database yet — the outer catch returned 404 and
    // every single link on every domain stopped resolving. One optional query
    // taking down the whole redirect is the worst possible failure here.
    let qr = null
    try {
      qr = await prisma.qrCode.findUnique({
        where: { domainId_shortCode: { domainId: domain.id, shortCode } },
        select: {
          id: true,
          link: {
            select: {
              id: true,
              destinationUrl: true,
              organizationId: true,
              deletedAt: true,
            },
          },
        },
      })
    } catch (err) {
      // Logged and ignored: a scan still resolves through the link below, it
      // just isn't attributed to a specific code.
      console.error('[redirect] qr lookup failed, continuing', err?.code || err)
    }

    const link =
      qr?.link ||
      (await prisma.link.findUnique({
        where: { domainId_shortCode: { domainId: domain.id, shortCode } },
        select: {
          id: true,
          destinationUrl: true,
          organizationId: true,
          deletedAt: true,
        },
      }))

    // A trashed link stops resolving. Its short URL may be printed on
    // something, so this is a 404 rather than a redirect to a stale
    // destination.
    if (!link || link.deletedAt) {
      return new Response('Not found', { status: 404 })
    }

    // Recorded BEFORE redirecting, and awaited. Fire-and-forget looks faster,
    // but a serverless function is frozen the moment its response is returned —
    // the insert would be cancelled mid-flight and the click lost. One indexed
    // insert is a few milliseconds; a click that never lands is permanent.
    const headers = request.headers
    try {
      await prisma.click.create({
        data: {
          linkId: link.id,
          qrCodeId: qr?.id || null,
          organizationId: link.organizationId,
          // Geo comes from the platform's edge headers — deriving it from an IP
          // would mean shipping a geo database and storing the address, and the
          // address is the part worth not keeping.
          country: headers.get('x-vercel-ip-country') || null,
          region: headers.get('x-vercel-ip-country-region') || null,
          city: headers.get('x-vercel-ip-city')
            ? decodeURIComponent(headers.get('x-vercel-ip-city'))
            : null,
          device: deviceFrom(headers.get('user-agent') || ''),
          browser: browserFrom(headers.get('user-agent') || ''),
          referrer: referrerFrom(headers.get('referer')),
        },
      })
    } catch (err) {
      // An unrecordable click is a lost statistic. A failed redirect is a
      // person who can't reach the page. Those aren't close, so this never
      // blocks the redirect.
      console.error('[redirect] click insert failed', err?.code || err)
    }

    // 302, not 301. A permanent redirect is cached by the browser forever,
    // which means editing a link's destination would never reach anyone who'd
    // already followed it — and every subsequent visit would skip this handler,
    // so the click would go uncounted too.
    return Response.redirect(link.destinationUrl, 302)
  } catch (err) {
    // 500, not 404. Returning "Not found" for a thrown error made a broken
    // query indistinguishable from a missing link — which is exactly how a
    // failing QR lookup looked like every link being absent.
    //
    // The message goes in the body too. Nobody's reading server logs while
    // testing a redirect on their phone, and "Not found" told us nothing.
    console.error('[redirect]', shortCode, err)
    return new Response(
      `Redirect failed: ${String(err?.message || err).split('\n')[0]}`,
      { status: 500 }
    )
  }
}
