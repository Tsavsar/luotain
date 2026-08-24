import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'

// POST /api/org/delete  { name }
//
// Permanently deletes the workspace. A real delete, not a flag — the same
// concept as deleting an account, and for the same reason: someone asking for
// this wants the data gone, and a row marked deleted is still a row holding
// their links and their analytics.
export async function POST(request) {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  // OWNER only. An admin can invite, rename and manage domains — none of which
  // is recoverable-in-kind with deleting the workspace out from under everyone
  // else in it.
  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: { role: true },
  })
  if (membership?.role !== 'OWNER') {
    return Response.json(
      { error: 'Only the workspace owner can delete it' },
      { status: 403 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true },
  })
  if (!org) {
    return Response.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // The typed name must match. Checked SERVER-side as well as in the form —
  // the confirmation is the only thing standing between a stray click and
  // permanent loss, and a check that only exists in the browser isn't one.
  const typed = String(body?.name || '').trim()
  if (typed.toLowerCase() !== org.name.trim().toLowerCase()) {
    return Response.json(
      { error: "That doesn't match the workspace name", field: 'name' },
      { status: 400 }
    )
  }

  // The last workspace can't go. Deleting it would leave the account signed in
  // with nowhere to be, and every page resolving an active org would fail —
  // a broken session rather than a clean exit.
  const otherCount = await prisma.membership.count({
    where: { userId, NOT: { organizationId } },
  })
  if (otherCount === 0) {
    return Response.json(
      {
        error:
          'This is your only workspace. Create another one first, or delete your account instead.',
        lastWorkspace: true,
      },
      { status: 400 }
    )
  }

  try {
    // One transaction. A half-deleted workspace — memberships gone but links
    // remaining — is worse than either outcome, and leaves rows nobody can
    // reach or remove.
    await prisma.$transaction(async (tx) => {
      // Clicks first: they reference links AND the organization, so deleting
      // either side first would orphan or block them depending on the
      // constraint. Explicit ordering rather than trusting cascade behaviour
      // that varies by relation.
      await tx.click.deleteMany({ where: { organizationId } })
      await tx.qrCode.deleteMany({ where: { link: { organizationId } } })
      await tx.link.deleteMany({ where: { organizationId } })
      await tx.invite.deleteMany({ where: { organizationId } })
      // Custom domains belonging to this workspace. The platform domain has a
      // null organizationId, so it isn't touched — deleting one workspace must
      // not take luot.link down with it.
      await tx.domain.deleteMany({ where: { organizationId } })
      await tx.membership.deleteMany({ where: { organizationId } })
      await tx.organization.delete({ where: { id: organizationId } })
    })

    // Where to land. The caller is still signed in and still has other
    // workspaces, so it switches to one rather than logging them out.
    const next = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { organizationId: true },
    })

    return Response.json({
      success: true,
      name: org.name,
      nextOrganizationId: next?.organizationId || null,
    })
  } catch (err) {
    console.error('[POST /api/org/delete]', err)
    const first = String(err?.message || 'Unknown error')
      .split('\n')[0]
      .trim()
    return Response.json(
      {
        error: `Couldn't delete the workspace: ${first}`,
        code: err?.code || null,
      },
      { status: 500 }
    )
  }
}
