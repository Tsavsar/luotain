// ─── Click filters ───
// The card filters, server side. Shared by /api/analytics,
// /api/links/[id]/analytics and the CSV export, so a filter narrows the
// workspace page, the link page and the file the same way.
//
// They arrive as repeated params: ?f=country:Norway&f=device:Mobile. They're
// applied after the rows are fetched rather than in the where clause, on
// purpose: the cards keep showing every option, so you can still see what
// you're filtering away, and a filtered query would hide the rest. That also
// means country names compare against countryName()'s output, which SQL
// couldn't do: older rows hold ISO codes.

export function parseFilters(params) {
  return params
    .getAll('f')
    .map((f) => {
      const i = f.indexOf(':')
      return i < 0 ? null : { type: f.slice(0, i), label: f.slice(i + 1) }
    })
    .filter(Boolean)
}

// What a row reads as under each filter type, labelled the way the cards
// label it — a null region is the "Unknown" row, a null referrer the
// "Direct" one — so picking any row on a card matches the rows it counted.
const VALUE = {
  country: (r) => r.country || 'Unknown',
  region: (r) => r.region || 'Unknown',
  city: (r) => r.city || 'Unknown',
  device: (r) => r.device || 'Unknown',
  browser: (r) => r.browser || 'Unknown',
  source: (r) => r.referrer || 'Direct',
  link: (r) => r.link?.shortCode,
}

// Same type ORs together, different types AND. Picking Norway and Ghana means
// "either", picking Norway and Mobile means "both" — which is what someone
// expects from two different questions. A type this doesn't know narrows
// nothing, rather than matching no row and emptying every card.
export function matcher(filters) {
  const byType = new Map()
  for (const f of filters) {
    if (!VALUE[f.type]) continue
    if (!byType.has(f.type)) byType.set(f.type, [])
    byType.get(f.type).push(f.label)
  }
  return (r) => {
    for (const [type, labels] of byType) {
      if (!labels.includes(VALUE[type](r))) return false
    }
    return true
  }
}
