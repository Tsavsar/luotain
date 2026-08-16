import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

const SLUG = /^[a-zA-Z0-9._-]+$/

// Slugs that would collide with a real path if the link lived on the app's own
// domain. Same list the redirect refuses to resolve.
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
])

async function authorize(id) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return { error }

  // Scoped to the caller's org, so a guessed id can't edit someone else's link.
  const link = await prisma.link.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      shortCode: true,
      destinationUrl: true,
      title: true,
      domainId: true,
      deletedAt: true,
    },
  })
  if (!link) {
    return {
      error: Response.json({ error: 'Link not found' }, { status: 404 }),
    }
  }
  return { link, organizationId, userId }
}

// PATCH /api/links/[id]  { destinationUrl?, title?, slug? }
export async function PATCH(request, { params }) {
  const { id } = await params
  const { error, link, organizationId } = await authorize(id)
  if (error) return error

  if (link.deletedAt) {
    return Response.json(
      { error: 'Restore this link before editing it' },
      { status: 409 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const data = {}

  // Both keys accepted. POST /api/links reads `destination` and this read only
  // `destinationUrl` — the same field under two names across two endpoints,
  // which is exactly how the duplicate button ended up 400ing.
  const rawDestination = body?.destinationUrl ?? body?.destination
  if (typeof rawDestination === 'string') {
    const raw = rawDestination.trim()
    if (!raw) {
      return Response.json(
        { error: 'Enter a destination', field: 'destinationUrl' },
        { status: 400 }
      )
    }
    // A scheme is added rather than demanded — people paste "acme.com" and mean
    // https, and rejecting that is a pointless hurdle.
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    let parsed
    try {
      parsed = new URL(withScheme)
    } catch {
      return Response.json(
        { error: "That doesn't look like a URL", field: 'destinationUrl' },
        { status: 400 }
      )
    }
    // http and https only. A javascript: or data: destination would turn every
    // short link into a way to run someone else's script on a click.
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return Response.json(
        {
          error: 'Links must start with http or https',
          field: 'destinationUrl',
        },
        { status: 400 }
      )
    }
    data.destinationUrl = parsed.toString()
  }

  if (typeof body?.title === 'string') {
    data.title = body.title.trim().slice(0, 120) || null
  }

  // Changing the slug BREAKS the old short URL, which may be printed on
  // something. Allowed, but gated to plans that pay for custom slugs — the same
  // check the create route makes.
  if (typeof body?.slug === 'string' && body.slug.trim() !== link.shortCode) {
    // No plan gate. Custom slugs are free on every tier — a short link you
    // can't name is most of the point of a short link.
    const slug = body.slug.trim()
    if (!SLUG.test(slug)) {
      return Response.json(
        {
          error: 'Use letters, numbers, dots, dashes or underscores',
          field: 'slug',
        },
        { status: 400 }
      )
    }
    if (RESERVED.has(slug.toLowerCase())) {
      return Response.json(
        { error: 'That one is reserved', field: 'slug' },
        { status: 400 }
      )
    }

    // Unique per domain, and a trashed link still holds its slug — it's
    // recoverable for 30 days, so handing the slug out now would mean two links
    // claiming it if the first is restored.
    const clash = await prisma.link.findFirst({
      where: { domainId: link.domainId, shortCode: slug, NOT: { id: link.id } },
      select: { id: true },
    })
    if (clash) {
      return Response.json(
        { error: 'That link is already taken', field: 'slug' },
        { status: 409 }
      )
    }
    data.shortCode = slug
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const updated = await prisma.link.update({
      where: { id: link.id },
      data,
      select: {
        id: true,
        shortCode: true,
        destinationUrl: true,
        title: true,
        domain: { select: { hostname: true } },
      },
    })
    return Response.json({
      link: {
        ...updated,
        shortUrl: `${updated.domain.hostname}/${updated.shortCode}`,
      },
    })
  } catch (err) {
    console.error('[PATCH /api/links/[id]]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      { error: `Couldn't save the link: ${first}`, code: err?.code || null },
      { status: 500 }
    )
  }
}

// GET /api/links/[id] — for the edit form.
export async function GET(request, { params }) {
  const { id } = await params
  const { error, link } = await authorize(id)
  if (error) return error
  return Response.json({ link })
}
