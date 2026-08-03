import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/session'

// The providers this app offers. Listed here rather than derived purely
// from what's linked, because the screen has to show what you COULD
// connect, not just what you have.
const PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'Github' },
]

// GET /api/me/accounts
export async function GET() {
  const email = await getCurrentUserEmail()
  if (!email) {
    return Response.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      avatarSeed: true,
    },
  })
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { provider: true, createdAt: true },
  })

  const linked = new Map(accounts.map((a) => [a.provider, a.createdAt]))

  return Response.json({
    user: {
      name: user.name || '',
      email: user.email || '',
      image: user.image || null,
      avatarSeed: user.avatarSeed || user.id,
    },
    providers: PROVIDERS.map((p) => ({
      ...p,
      connected: linked.has(p.id),
      connectedAt: linked.get(p.id) || null,
    })),
  })
}
