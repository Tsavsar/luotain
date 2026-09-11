// GET /api/host
//
// Temporary. Echoes the hostname the redirect handler would resolve against,
// plus whether a Domain row exists for it.
//
// Everything else checks out — the Domain row, the Link, the unique index — so
// the one remaining unknown is whether the value the server computes matches
// the row. Behind a proxy, x-forwarded-host and url.hostname can differ, and
// the redirect uses the former.
//
// Delete this once the answer is known.
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const url = new URL(request.url)

  // Exactly the expression [shortCode]/route.js uses, so this can't disagree
  // with it.
  const resolved = (request.headers.get('x-forwarded-host') || url.hostname)
    .split(':')[0]
    .toLowerCase()

  const domain = await prisma.domain
    .findUnique({
      where: { hostname: resolved },
      select: { id: true, verified: true },
    })
    .catch((e) => ({ error: String(e?.code || e?.message || e) }))

  return Response.json({
    resolved,
    domainFound: Boolean(domain?.id),
    domain,
    // The raw values, so it's obvious which one the mismatch is in.
    raw: {
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'url.hostname': url.hostname,
      host: request.headers.get('host'),
    },
  })
}
