import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

// Every route that acts on a specific link (recover, delete,
// eventually edit) needs the same chain checked in the same order:
// who's asking -> does that user exist -> does the link exist -> are
// they actually a member of the org that owns it. One function that
// every route calls, rather than each route repeating that chain and
// risking a step quietly getting skipped in one of them — matches
// the pattern the existing routes already use (getCurrentUserEmail,
// then a prisma.user lookup), just extended one step further to also
// verify org ownership of the specific link being acted on.
//
// Returns { user, link } on success, or { error: <Response> } to
// return immediately as-is on failure — the caller never has to
// know WHICH check failed, just whether one did.
export async function authorizeLinkAccess(linkId) {
  const email = await getCurrentUserEmail()
  if (!email) {
    return {
      error: Response.json({ error: 'Not signed in' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return {
      error: Response.json({ error: 'User not found' }, { status: 404 }),
    }
  }

  const link = await prisma.link.findUnique({ where: { id: linkId } })
  if (!link) {
    return {
      error: Response.json({ error: 'Link not found' }, { status: 404 }),
    }
  }

  // Compound-unique lookup (userId_organizationId), same field the
  // schema's own @@unique([userId, organizationId]) on Membership is
  // built around — one query instead of fetching all memberships and
  // filtering in JS. Not "is this the user's currently active org",
  // deliberately: membership in the org that owns the link is the
  // actual authorization boundary, independent of whichever org
  // happens to be selected in the switcher right now.
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: link.organizationId,
      },
    },
  })
  if (!membership) {
    return {
      error: Response.json({ error: 'Not authorized' }, { status: 403 }),
    }
  }

  return { user, link }
}
