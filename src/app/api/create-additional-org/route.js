import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'
import { freeWorkspaceReason } from '@/lib/workspacelimit'

export async function POST(request) {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { orgName } = await request.json()

  if (!orgName) {
    return Response.json(
      { error: 'Organization name is required' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // A new workspace starts on Free, so this is where the one-free-workspace
  // rule bites. 402 like the other plan limits: a billing problem, not a
  // permissions one.
  const limitReason = await freeWorkspaceReason(user.id)
  if (limitReason) {
    return Response.json(
      { error: limitReason, code: 'FREE_WORKSPACE_LIMIT' },
      { status: 402 }
    )
  }

  const org = await prisma.organization.create({ data: { name: orgName } })

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  })

  return Response.json({ success: true })
}
