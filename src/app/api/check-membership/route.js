import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getCurrentUserEmail } from '@/lib/session'

export async function GET() {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ hasOrg: false, loggedIn: false })
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

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
    name: user.name || '', // populated already for OAuth users, empty for email-code
  })
}
