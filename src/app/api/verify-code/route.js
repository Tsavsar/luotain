import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

export async function POST(request) {
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

  // Correct code — create the account if this is a first-time signup,
  // or just confirm it if they already exist (login reuses this same
  // endpoint, since verifying a code is the same action either way).
  // name/image stay empty here — those only get populated by the
  // OAuth adapter when someone signs in with Google/GitHub instead.
  await prisma.user.upsert({
    where: { email: decoded.email },
    update: {},
    create: { email: decoded.email },
  })

  cookieStore.delete('verification-token')

  return Response.json({ success: true })
}
