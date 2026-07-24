import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'
import { cookies } from 'next/headers'

// Same resolution the existing org-info route already does inline —
// pulled out so any other route that needs "which org is this
// request for" doesn't reimplement the cookie-trust logic. Never
// trusts the active-org-id cookie on its own; only treats it as
// valid if it matches a real membership, otherwise falls back to
// the user's first org.
//
// Returns { userId, organizationId } on success, or { error:
// <Response> } to return immediately as-is on failure.
export async function resolveActiveOrg() {
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

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })
  if (memberships.length === 0) {
    return {
      error: Response.json({ error: 'No organization' }, { status: 404 }),
    }
  }

  const cookieStore = await cookies()
  const requestedActiveId = cookieStore.get('active-org-id')?.value

  const activeMembership =
    memberships.find((m) => m.organizationId === requestedActiveId) ||
    memberships[0]

  return {
    userId: user.id,
    organizationId: activeMembership.organizationId,
  }
}
