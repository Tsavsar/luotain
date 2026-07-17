import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getCurrentUserEmail } from '@/lib/session'

export async function POST(request) {
  const email = await getCurrentUserEmail()

  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { fullName, orgName } = await request.json()

  if (!fullName || !orgName) {
    return Response.json({ error: 'Both fields are required' }, { status: 400 })
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const user = await prisma.user.update({
    where: { email },
    data: { name: fullName },
  })

  const org = await prisma.organization.create({
    data: { name: orgName },
  })

  // creator of an org is its OWNER by default
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  })

  return Response.json({ success: true })
}
