import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/auth'

// POST /api/public/claim
//
// Moves links made anonymously on the landing page into the workspace of
// whoever just signed up. The ids come from the httpOnly cookie the public
// create endpoint set, NOT from the request body — a body could name any
// link id and steal someone else's.
//
// Called after onboarding rather than during it: a new account has no
// organization until then, and there'd be nowhere to move them to.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CLAIM_COOKIE = 'luotain_pending_links'
const PUBLIC_ORG = process.env.PUBLIC_ORG_ID

export async function POST() {
  if (!PUBLIC_ORG) {
    // Nothing to claim from. Not an error — the feature simply isn't on.
    return Response.json({ claimed: 0 })
  }

  const email = await getCurrentUserEmail()
  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const jar = await cookies()
  const raw = jar.get(CLAIM_COOKIE)?.value
  if (!raw) return Response.json({ claimed: 0 })

  const ids = raw.split(',').filter(Boolean).slice(0, 5)
  if (ids.length === 0) return Response.json({ claimed: 0 })

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        memberships: {
          select: { organizationId: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    const orgId = user?.memberships?.[0]?.organizationId
    if (!orgId) {
      // Signed in but not yet in an organization — onboarding isn't finished.
      // The cookie stays, so this can run again once it is.
      return Response.json({ claimed: 0, pending: true })
    }

    // The `organizationId` in the where clause is the security boundary: only
    // links still sitting in the public workspace can move. A link already
    // claimed, or one belonging to a real workspace, won't match however its
    // id got into the cookie.
    const result = await prisma.link.updateMany({
      where: {
        id: { in: ids },
        organizationId: PUBLIC_ORG,
        deletedAt: null,
      },
      data: {
        organizationId: orgId,
        createdById: user.id,
      },
    })

    // Clicks already logged against the public org move too, or the link
    // arrives in its new home showing zero despite having been scanned.
    if (result.count > 0) {
      await prisma.click.updateMany({
        where: { linkId: { in: ids }, organizationId: PUBLIC_ORG },
        data: { organizationId: orgId },
      })
    }

    // Cleared either way. A cookie that survives a successful claim would
    // retry on every subsequent signup from this browser.
    jar.delete(CLAIM_COOKIE)

    return Response.json({ claimed: result.count })
  } catch (err) {
    console.error('[POST /api/public/claim]', err)
    // The cookie is deliberately NOT cleared here — a failed claim should be
    // retryable rather than silently losing the links.
    return Response.json({ error: 'Could not claim links' }, { status: 500 })
  }
}
