import { prisma } from '@/lib/prisma'

export async function POST(request) {
  const { email } = await request.json()

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  return Response.json({ exists: !!user })
}
