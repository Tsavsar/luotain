import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SHORT_DOMAIN } from '@/lib/shortlink'

// POST /api/public/links  { destination }
//
// Anonymous link creation, for the hero. No account, no session.
//
// Links need an organizationId, so they go to a house workspace named by
// PUBLIC_ORG_ID. The alternative — making the column nullable — touches every
// query in the app that scopes by org, which is a large change to support one
// form.
//
// The ids are also written to a cookie, so a later signup can claim them into
// the new workspace. That claim step isn't built yet; the cookie is what makes
// it possible without asking anyone to re-create their link.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CLAIM_COOKIE = 'luotain_pending_links'

// Per-IP, in memory. On serverless this is per-instance rather than global, so
// it slows abuse rather than stopping it — the honest ceiling without a shared
// store. The global cap below is the real backstop.
const RECENT = new Map()
const PER_IP_PER_HOUR = 5
const GLOBAL_PER_HOUR = 200

function ipOf(request) {
  const fwd = request.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0] : '').trim() || 'unknown'
}

function rateLimited(ip) {
  const now = Date.now()
  const hour = 60 * 60 * 1000
  const hits = (RECENT.get(ip) || []).filter((t) => now - t < hour)
  if (hits.length >= PER_IP_PER_HOUR) return true
  hits.push(now)
  RECENT.set(ip, hits)
  // Swept here rather than on a timer: a serverless instance has no lifecycle
  // to hang one on, and the map would otherwise grow for the life of the
  // instance.
  if (RECENT.size > 5000) {
    for (const [k, v] of RECENT) {
      if (v.every((t) => now - t > hour)) RECENT.delete(k)
    }
  }
  return false
}

// Adjective + noun, matching the app's own generated slugs so a public link
// looks like any other.
const SLUG = /^[a-zA-Z0-9._-]+$/

// Paths the app itself owns, plus the obvious impersonation targets. This list
// matters more on an anonymous form than in the app: there's no account to
// trace a bad slug back to.
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
  'admin',
  'support',
  'help',
  'billing',
  'account',
  'settings',
  'security',
])

const ADJECTIVES = [
  'swift',
  'calm',
  'brave',
  'keen',
  'plain',
  'warm',
  'sharp',
  'proud',
  'quick',
  'bright',
]
const NOUNS = [
  'otter',
  'heron',
  'pike',
  'crow',
  'hare',
  'newt',
  'moth',
  'toad',
  'finch',
  'lynx',
]

function candidate() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${a}-${n}`
}

export async function POST(request) {
  const orgId = process.env.PUBLIC_ORG_ID
  if (!orgId) {
    console.error('[public/links] PUBLIC_ORG_ID is not set')
    return Response.json(
      { error: 'Link creation is unavailable right now' },
      { status: 503 }
    )
  }

  const ip = ipOf(request)
  if (rateLimited(ip)) {
    return Response.json(
      {
        error:
          "That's a few links in a short time. Try again later, or sign up for your own workspace.",
      },
      { status: 429 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // A requested slug, optional. Anonymous links can name themselves, which is
  // what the form offers — but the reserved list below matters more here than
  // in the app, since there's no account behind the request.
  const requestedSlug = String(body?.slug || '')
    .trim()
    .toLowerCase()

  const raw = String(body?.destination || '').trim()
  if (!raw) {
    return Response.json(
      { error: 'Enter a link to shorten', field: 'destination' },
      { status: 400 }
    )
  }

  // A scheme is added rather than demanded — people paste "acme.com".
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  let url
  try {
    url = new URL(withScheme)
  } catch {
    return Response.json(
      { error: "That doesn't look like a link", field: 'destination' },
      { status: 400 }
    )
  }

  // http and https only. Without this an anonymous form becomes a way to hand
  // out javascript: and data: URLs under a domain people trust.
  if (!['http:', 'https:'].includes(url.protocol)) {
    return Response.json(
      { error: 'Links must start with http or https', field: 'destination' },
      { status: 400 }
    )
  }

  const host = url.hostname.toLowerCase()

  // No pointing at ourselves. A short link to a short link is a redirect loop
  // waiting to happen, and a free way to launder a destination.
  if (
    host === SHORT_DOMAIN.toLowerCase() ||
    host.endsWith('.luotain.app') ||
    host === 'luotain.app'
  ) {
    return Response.json(
      { error: "You can't shorten a Luotain link", field: 'destination' },
      { status: 400 }
    )
  }

  // Private ranges, same reasoning as the OG fetcher: an open form that
  // accepts internal addresses is a way to probe a network.
  const isPrivate =
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  if (isPrivate) {
    return Response.json(
      { error: 'That address is not supported', field: 'destination' },
      { status: 400 }
    )
  }

  try {
    const domain = await prisma.domain.findFirst({
      where: { hostname: SHORT_DOMAIN },
      select: { id: true, hostname: true },
    })
    if (!domain) {
      console.error('[public/links] no Domain row for', SHORT_DOMAIN)
      return Response.json(
        { error: 'Link creation is unavailable right now' },
        { status: 503 }
      )
    }

    // Global backstop. The per-IP limiter is per-instance; this one reads the
    // database, so it holds however many instances are running.
    const lastHour = await prisma.link.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: new Date(Date.now() - 3600_000) },
      },
    })
    if (lastHour >= GLOBAL_PER_HOUR) {
      return Response.json(
        { error: 'Link creation is busy right now. Try again shortly.' },
        { status: 429 }
      )
    }

    // A requested slug is checked once and refused if taken — no silent
    // fallback to a generated one. Someone who typed a name and got a random
    // word instead would reasonably think the form ignored them.
    if (requestedSlug) {
      if (!SLUG.test(requestedSlug)) {
        return Response.json(
          {
            error: 'Use letters, numbers, dots, dashes or underscores',
            field: 'slug',
          },
          { status: 400 }
        )
      }
      if (RESERVED.has(requestedSlug)) {
        return Response.json(
          { error: 'That one is reserved', field: 'slug' },
          { status: 400 }
        )
      }
      const domainRow = await prisma.domain.findFirst({
        where: { hostname: SHORT_DOMAIN },
        select: { id: true },
      })
      const taken = domainRow
        ? await prisma.link.findUnique({
            where: {
              domainId_shortCode: {
                domainId: domainRow.id,
                shortCode: requestedSlug,
              },
            },
            select: { id: true },
          })
        : null
      if (taken) {
        return Response.json(
          { error: 'That link is already taken', field: 'slug' },
          { status: 409 }
        )
      }
    }

    // A few attempts, then give up rather than loop. Collisions are rare at
    // 100 combinations × a random suffix, and an unbounded retry on a
    // saturated namespace would hang the request.
    let link = null
    for (let attempt = 0; attempt < 6 && !link; attempt++) {
      // One extra character after a few misses, rather than a hyphenated
      // suffix — at 887 million combinations a collision is already unlikely,
      // and lengthening beats making the code look different.
      const shortCode = requestedSlug
        ? requestedSlug
        : candidate(attempt < 3 ? 6 : 7)
      const taken = await prisma.link.findUnique({
        where: { domainId_shortCode: { domainId: domain.id, shortCode } },
        select: { id: true },
      })
      if (taken) continue
      link = await prisma.link.create({
        data: {
          shortCode,
          destinationUrl: url.toString(),
          domainId: domain.id,
          organizationId: orgId,
        },
        select: { id: true, shortCode: true, destinationUrl: true },
      })
    }

    if (!link) {
      return Response.json(
        { error: 'Could not generate a link. Try again.' },
        { status: 500 }
      )
    }

    // Remembered so a signup can claim it. Capped at 5 — this is a handoff,
    // not storage, and a cookie that grows without limit is its own problem.
    try {
      const jar = await cookies()
      const existing = jar.get(CLAIM_COOKIE)?.value
      const ids = existing ? existing.split(',').filter(Boolean) : []
      ids.push(link.id)
      jar.set(CLAIM_COOKIE, ids.slice(-5).join(','), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    } catch (err) {
      // A failed cookie costs the claim, not the link.
      console.error('[public/links] claim cookie failed', err)
    }

    return Response.json({
      link: {
        shortCode: link.shortCode,
        shortUrl: `${domain.hostname}/${link.shortCode}`,
        destination: link.destinationUrl,
      },
    })
  } catch (err) {
    console.error('[POST /api/public/links]', err)
    return Response.json(
      { error: 'Could not create the link' },
      { status: 500 }
    )
  }
}
