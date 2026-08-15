import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// GET /api/og?url=...
//
// Reads the Open Graph image from a destination so the link page can show what
// the page actually looks like rather than a placeholder.
//
// Proxied through the server rather than fetched in the browser, for two
// reasons: most sites block cross-origin reads from a page, and doing it here
// means a visitor's browser never contacts the destination just to render a
// dashboard.
export const runtime = 'nodejs'

// Signed-in only. Open, this is a URL-fetching service anyone could point at
// internal addresses — the classic way a helpful preview endpoint becomes a
// way to probe a private network.
export async function GET(request) {
  const { error } = await resolveActiveOrg()
  if (error) return error

  const target = new URL(request.url).searchParams.get('url')
  if (!target) {
    return Response.json({ error: 'Missing url' }, { status: 400 })
  }

  let parsed
  try {
    parsed = new URL(target)
  } catch {
    return Response.json({ error: 'Invalid url' }, { status: 400 })
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return Response.json({ error: 'Unsupported protocol' }, { status: 400 })
  }

  // Localhost and private ranges refused. Without this, someone could ask the
  // server to fetch its own network — the reason SSRF is a category rather
  // than a curiosity.
  const host = parsed.hostname.toLowerCase()
  const isPrivate =
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  if (isPrivate) {
    return Response.json({ error: 'Unsupported host' }, { status: 400 })
  }

  try {
    // Aborted after 4 seconds. A slow destination shouldn't hold a serverless
    // function open, and a preview is worth waiting a moment for and no more.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Some hosts serve nothing useful without a browser-ish agent.
        'User-Agent':
          'Mozilla/5.0 (compatible; LuotainBot/1.0; +https://luotain.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timer)

    if (!res.ok) {
      return Response.json({ image: null, title: null }, { status: 200 })
    }

    // Only the first 100KB. OG tags live in <head>, and downloading a whole
    // page to read two meta tags is wasteful — some pages are megabytes.
    const reader = res.body?.getReader()
    let html = ''
    if (reader) {
      const decoder = new TextDecoder()
      let received = 0
      while (received < 100_000) {
        const { done, value } = await reader.read()
        if (done) break
        received += value.length
        html += decoder.decode(value, { stream: true })
        if (html.includes('</head>')) break
      }
      reader.cancel().catch(() => {})
    } else {
      html = await res.text()
    }

    const pick = (prop) => {
      const patterns = [
        new RegExp(
          `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
          'i'
        ),
        new RegExp(
          `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`,
          'i'
        ),
        new RegExp(
          `<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`,
          'i'
        ),
      ]
      for (const re of patterns) {
        const m = html.match(re)
        if (m?.[1]) return m[1]
      }
      return null
    }

    let image =
      pick('og:image') || pick('twitter:image') || pick('twitter:image:src')

    // Relative OG images are common and useless without resolving them against
    // the page they came from.
    if (image) {
      try {
        image = new URL(image, res.url || parsed.toString()).toString()
      } catch {
        image = null
      }
    }

    const title =
      pick('og:title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null

    return Response.json({ image, title })
  } catch (err) {
    // Never an error to the client. A missing preview is a cosmetic gap, and
    // a link page shouldn't break because someone's site is down.
    console.error('[og]', parsed.hostname, err?.name || err)
    return Response.json({ image: null, title: null }, { status: 200 })
  }
}
