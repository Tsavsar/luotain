import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

export async function GET() {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ hasOrg: false, loggedIn: false })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ hasOrg: false, loggedIn: true })
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  })

  return Response.json({
    hasOrg: !!membership,
    loggedIn: true,
    name: user.name || '',
  })
}
