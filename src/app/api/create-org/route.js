import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'
import { freeWorkspaceReason } from '@/lib/workspacelimit'

export async function POST(request) {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { fullName, orgName } = await request.json()

  if (!fullName || !orgName) {
    return Response.json({ error: 'Both fields are required' }, { status: 400 })
  }

  // Onboarding's first workspace never trips this — someone onboarding owns
  // nothing yet. It's here because this route makes a Free workspace too, and
  // a limit the other route enforces would otherwise be one request away.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existing) {
    const limitReason = await freeWorkspaceReason(existing.id)
    if (limitReason) {
      return Response.json(
        { error: limitReason, code: 'FREE_WORKSPACE_LIMIT' },
        { status: 402 }
      )
    }
  }

  const user = await prisma.user.update({
    where: { email },
    data: { name: fullName },
  })

  const org = await prisma.organization.create({
    data: { name: orgName },
  })

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  })

  return Response.json({ success: true })
}
