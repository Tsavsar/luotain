import { prisma } from '@/lib/prisma'
import { resolveActiveOrg } from '@/lib/resolveActiveOrg'
import { csvExportReason } from '@/lib/plans'
import { countryName } from '@/lib/countries'

// GET /api/links/[id]/export?days=30
//
// Every click and scan on one link as a CSV, for the range the link page is
// showing. Pro only, enforced here rather than in the page — the menu item
// shows for everyone, and a hand-rolled request is what the check is for.
//
// One row per visit, the same fields the analytics cards are built from. No
// visitor hash: it exists to count unique visitors, and a column of hashes in
// a spreadsheet someone emails around is a privacy leak with no use.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RANGES = [7, 30, 60, 90, 365]
const COLUMNS = [
  'Date (UTC)',
  'Type',
  'QR code',
  'Country',
  'Region',
  'City',
  'Device',
  'Browser',
  'Source',
]
// Rows per database read. The file streams out page by page, so a link with a
// year of traffic never sits in memory whole.
const PAGE = 1000

// Quoted when it has to be, and never read as a formula. A city or referrer
// starting with "=" opens as a live formula in Excel and Sheets — the classic
// CSV injection — so those cells get a leading apostrophe, which spreadsheets
// show as plain text.
function cell(value) {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function GET(request, { params }) {
  const { error, organizationId } = await resolveActiveOrg()
  if (error) return error

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  })
  const reason = csvExportReason(org?.plan)
  if (reason) {
    return Response.json(
      { error: reason, code: 'CSV_EXPORT', plan: org?.plan },
      { status: 402 }
    )
  }

  const { id } = await params
  // Scoped to the caller's workspace, so a guessed id exports nothing.
  const link = await prisma.link.findFirst({
    where: { id, organizationId },
    select: { id: true, shortCode: true },
  })
  if (!link) {
    return Response.json({ error: 'Link not found' }, { status: 404 })
  }

  const requested = Number(new URL(request.url).searchParams.get('days'))
  const days = RANGES.includes(requested) ? requested : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // A byte-order mark first, or Excel opens the file as Latin-1 and São
        // Paulo arrives as "SÃ£o Paulo".
        controller.enqueue(
          encoder.encode(`\uFEFF${COLUMNS.map(cell).join(',')}\r\n`)
        )

        let cursor = null
        for (;;) {
          const rows = await prisma.click.findMany({
            where: { linkId: link.id, createdAt: { gte: since } },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            take: PAGE,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            select: {
              id: true,
              createdAt: true,
              country: true,
              region: true,
              city: true,
              device: true,
              browser: true,
              referrer: true,
              qrCodeId: true,
              qrCode: { select: { label: true } },
            },
          })
          if (rows.length === 0) break

          const lines = rows.map((c) =>
            [
              c.createdAt.toISOString(),
              c.qrCodeId ? 'Scan' : 'Click',
              c.qrCode?.label || '',
              // Older rows hold ISO codes; the cards show names, so this does
              // too, or "US" and "United States" pivot as two countries.
              countryName(c.country),
              c.region,
              c.city,
              c.device,
              c.browser,
              // Null referrer is a direct visit — the cards call it Direct too.
              c.referrer || 'Direct',
            ]
              .map(cell)
              .join(',')
          )
          controller.enqueue(encoder.encode(`${lines.join('\r\n')}\r\n`))

          if (rows.length < PAGE) break
          cursor = rows[rows.length - 1].id
        }
        controller.close()
      } catch (err) {
        console.error('[GET /api/links/[id]/export]', err)
        controller.error(err)
      }
    },
  })

  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="luotain-${link.shortCode}-${days}d-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
