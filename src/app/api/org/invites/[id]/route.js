import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// DELETE /api/org/invites/[id]
//
// Cancels a pending invite. A hard delete: the token has to stop working
// immediately, and a soft-deleted invite row that still resolves would be
// worse than no cancel button at all.
export async function DELETE(request, { params }) {
  const { id } = await params
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: { role: true },
  })
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return Response.json(
      { error: 'Only an owner or admin can cancel invites' },
      { status: 403 }
    )
  }

  // Scoped to the caller's org, so a guessed id can't cancel someone else's
  // invite.
  const invite = await prisma.invite.findFirst({
    where: { id, organizationId },
    select: { id: true, email: true },
  })
  if (!invite) {
    return Response.json({ error: 'Invite not found' }, { status: 404 })
  }

  try {
    await prisma.invite.delete({ where: { id: invite.id } })
    return Response.json({ success: true, email: invite.email })
  } catch (err) {
    console.error('[DELETE /api/org/invites/[id]]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      {
        error: `Couldn't cancel the invite: ${first}`,
        code: err?.code || null,
      },
      { status: 500 }
    )
  }
}
