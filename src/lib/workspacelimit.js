import { prisma } from '@/lib/prisma'

// ─── One free workspace per person ───
// Plans are per workspace, so without this the Free tier's five links are
// five per workspace — and workspaces are free to make, which adds up to
// unlimited free links for anyone who makes enough of them.
//
// Counts workspaces the person OWNS that are on Free. Being a member of
// someone else's workspace doesn't count against them, and paid workspaces
// don't either: once every workspace they own is paid, they can start one
// more on Free.
//
// Server only — it reads the database — which is why it lives here and not
// in plans.js, which the browser imports too.
export async function freeWorkspaceReason(userId) {
  const ownedFree = await prisma.membership.count({
    where: { userId, role: 'OWNER', organization: { plan: 'FREE' } },
  })
  if (ownedFree === 0) return null
  return 'You already have a free workspace. Upgrade one of your workspaces to add another.'
}
