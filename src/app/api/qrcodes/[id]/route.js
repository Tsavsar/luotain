import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { shortUrlFor } from '@/lib/shortlink'
import { QR_PATTERNS } from '@/lib/qrdesign'

// Loads a QR and confirms it belongs to the caller's org. Scoped through the
// link, since QrCode has no organizationId of its own — it belongs to a link,
// and the link belongs to an org. Without this check a guessed id would let
// anyone restyle or delete someone else's code.
async function authorize(id) {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return { error }

  const qr = await prisma.qrCode.findFirst({
    where: { id, link: { organizationId } },
    select: {
      id: true,
      shortCode: true,
      domain: { select: { hostname: true } },
    },
  })
  if (!qr) {
    return {
      error: Response.json({ error: 'QR code not found' }, { status: 404 }),
    }
  }
  return { qr }
}

// PATCH /api/qrcodes/[id]  { label?, color?, markerColor?, pattern?, branding? }
//
// The design only. The slug deliberately can't be changed: it's printed on
// things, and rewriting it would silently break every code already out in the
// world. Restyling is safe because the encoded URL doesn't change.
export async function PATCH(request, { params }) {
  const { id } = await params
  const { error, qr } = await authorize(id)
  if (error) return error

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const data = {}

  if (typeof body?.label === 'string') {
    const label = body.label.trim().slice(0, 60)
    if (!label) {
      return Response.json(
        { error: 'Give the code a label', field: 'label' },
        { status: 400 }
      )
    }
    data.label = label
  }

  // Validated against the design's own options rather than accepting any
  // string — an unknown pattern would fall through to squares, and an
  // arbitrary colour could be anything at all.
  const HEX = /^#[0-9a-fA-F]{6}$/
  if (HEX.test(body?.color || '')) data.color = body.color.toLowerCase()
  if (HEX.test(body?.markerColor || '')) {
    data.markerColor = body.markerColor.toLowerCase()
  }
  if (QR_PATTERNS.some((p) => p.id === body?.pattern))
    data.pattern = body.pattern
  if (typeof body?.branding === 'boolean') data.branding = body.branding

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updated = await prisma.qrCode.update({
    where: { id: qr.id },
    data,
    include: {
      domain: { select: { hostname: true } },
      _count: { select: { clicks: true } },
    },
  })

  return Response.json({
    qrCode: {
      id: updated.id,
      label: updated.label,
      shortCode: updated.shortCode,
      scanUrl: shortUrlFor(updated.shortCode, updated.domain.hostname),
      color: updated.color,
      markerColor: updated.markerColor,
      pattern: updated.pattern,
      branding: updated.branding,
      scans: updated._count.clicks,
      createdAt: updated.createdAt,
    },
  })
}

// DELETE /api/qrcodes/[id]
//
// A hard delete, unlike links — there's no trash for QR codes. Worth knowing
// why: a link's slug can be recovered because nothing physical points at it,
// whereas a deleted QR's slug frees up immediately and anything already printed
// stops resolving. That's a genuine one-way door, and the UI should say so
// before calling this.
export async function DELETE(request, { params }) {
  const { id } = await params
  const { error, qr } = await authorize(id)
  if (error) return error

  await prisma.qrCode.delete({ where: { id: qr.id } })

  return Response.json({ success: true })
}
