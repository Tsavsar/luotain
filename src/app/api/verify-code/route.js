import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { setAppSession } from '@/lib/session'

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

  try {
    const user = await prisma.user.upsert({
      where: { email: decoded.email },
      update: {},
      create: { email: decoded.email },
    })

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
    })

    await setAppSession(decoded.email)

    cookieStore.delete('verification-token')

    return Response.json({ success: true, hasOrg: !!membership })
  } catch (err) {
    console.error(
      'verify-code: correct code, but post-verification step failed:',
      err
    )
    return Response.json(
      {
        error:
          'Code was correct, but something went wrong finishing sign-in. Please try again.',
      },
      { status: 500 }
    )
  }
}
