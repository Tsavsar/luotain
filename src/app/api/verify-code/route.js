import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export async function POST(request) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const { code } = await request.json()

  if (!code) {
    return Response.json({ error: 'Code is required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('verification-token')?.value

  if (!token) {
    return Response.json(
      { error: 'No pending verification found' },
      { status: 400 }
    )
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
  } catch (err) {
    return Response.json(
      { error: 'Code expired, please request a new one' },
      { status: 400 }
    )
  }

  if (decoded.code !== code) {
    return Response.json({ error: 'Incorrect code' }, { status: 400 })
  }

  await prisma.user.upsert({
    where: { email: decoded.email },
    update: {},
    create: { email: decoded.email },
  })

  cookieStore.delete('verification-token')

  return Response.json({ success: true })
}
