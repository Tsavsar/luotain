import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { openPortal } from '@/lib/billing'

// POST /api/billing/portal
//
// Where someone updates a card, downloads an invoice or cancels. Polar hosts
// it, which is why this app has never held a card number and never should.
export async function POST() {
  const { error, organizationId, userId } = await resolveActiveOrg()
  if (error) return error

  const membership = await prisma.membership.findFirst({
    where: { organizationId, userId },
    select: { role: true },
  })
  if (membership?.role !== 'OWNER') {
    return Response.json(
      { error: 'Only the workspace owner can manage billing' },
      { status: 403 }
    )
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { customerId: true },
  })

  const result = await openPortal({ customerId: org?.customerId })
  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 })
  }
  return Response.json({ url: result.url })
}
