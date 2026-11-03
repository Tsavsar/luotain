import { PLANS } from '@/lib/plans'
import { withDefaults } from '@/lib/preferences'
import { getMockLinksTable, getMockTrash } from '@/lib/mockAnalytics'
import { DEMO_NOT_SAVED, readDemoDeleted } from '@/lib/demo'

// ─── The demo's API ───
// In the demo (lib/demo.js) the dashboard runs against this instead of the
// server. installDemoApi swaps window.fetch for a version that answers every
// request to the app's own /api in the browser:
//
//   - reads get the demo workspace: Acme, on Pro, with you as its owner;
//   - writes get a 403 carrying DEMO_NOT_SAVED, so each page says so through
//     its own error toast instead of pretending it worked.
//
// The pages that show data already have mock branches and never ask; this
// covers the rest (the header's profile and workspace, settings, the link
// picker) and is the guarantee that nothing a visitor does reaches the server.
// Auth's own endpoints pass through: the session check only reads, and it's
// what tells a visitor from someone with an account.

const DAY = 24 * 60 * 60 * 1000
const ago = (days) => new Date(Date.now() - days * DAY).toISOString()

const ORG = { id: 'demo', name: 'Acme', image: null, avatarSeed: 'acme' }

const YOU = {
  name: 'Demo User',
  email: 'demo@luotain.app',
  image: null,
  avatarSeed: 'demo-user',
}

function links() {
  return getMockLinksTable('Last 30 days', [], readDemoDeleted()).map((l) => ({
    id: l.id,
    shortCode: l.shortUrl.split('/').pop(),
    shortUrl: l.shortUrl,
    destination: l.destination,
    title: null,
    clicks: l.clicks,
    createdAt: l.createdAt,
  }))
}

const READS = {
  '/api/me': () => ({ user: { ...YOU, profileUpdatedAt: null } }),

  '/api/dashboard-info': () => ({
    orgName: ORG.name,
    orgImage: ORG.image,
    orgAvatarSeed: ORG.avatarSeed,
    activeOrgId: ORG.id,
    allOrgs: [ORG],
    userImage: null,
  }),

  '/api/plan': () => ({
    plan: PLANS.PRO.id,
    linkCount: links().length + getMockTrash(readDemoDeleted()).length,
    toggleAvailable: false,
    limits: {
      maxLinks: PLANS.PRO.maxLinks,
      customSlugs: PLANS.PRO.customSlugs,
      csvExport: PLANS.PRO.csvExport,
      customDomain: PLANS.PRO.customDomain,
    },
  }),

  '/api/org': () => ({
    organization: {
      ...ORG,
      plan: PLANS.PRO.id,
      createdAt: ago(212),
      updatedAt: ago(9),
    },
  }),

  '/api/org/members': () => ({
    role: 'OWNER',
    members: [
      {
        id: 'demo-member-you',
        role: 'OWNER',
        joinedAt: ago(212),
        isYou: true,
        userId: 'demo-user',
        ...YOU,
      },
      {
        id: 'demo-member-ada',
        role: 'ADMIN',
        joinedAt: ago(140),
        isYou: false,
        userId: 'demo-ada',
        name: 'Ada Okafor',
        email: 'ada@acme.com',
        image: null,
        avatarSeed: 'ada-okafor',
      },
      {
        id: 'demo-member-jonas',
        role: 'MEMBER',
        joinedAt: ago(38),
        isYou: false,
        userId: 'demo-jonas',
        name: 'Jonas Berg',
        email: 'jonas@acme.com',
        image: null,
        avatarSeed: 'jonas-berg',
      },
    ],
    invites: [
      {
        id: 'demo-invite-mira',
        email: 'mira@acme.com',
        role: 'MEMBER',
        createdAt: ago(2),
        expiresAt: ago(-5),
        expired: false,
        invitedBy: YOU.name,
      },
    ],
  }),

  '/api/me/accounts': () => ({
    user: YOU,
    providers: [
      { id: 'google', label: 'Google', connected: true, connectedAt: ago(212) },
      { id: 'github', label: 'Github', connected: false, connectedAt: null },
    ],
  }),

  '/api/me/preferences': () => ({ preferences: withDefaults(null) }),

  // This browser, and a phone signed in a few days ago, so the page shows
  // what it's for: telling your sessions apart.
  '/api/me/sessions': () => ({
    sessions: [
      {
        id: 'demo-session-here',
        userAgent: window.navigator.userAgent,
        city: null,
        country: null,
        lastActiveAt: ago(0),
        createdAt: ago(0),
        isCurrent: true,
      },
      {
        id: 'demo-session-phone',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
        city: 'Oslo',
        country: 'Norway',
        lastActiveAt: ago(2),
        createdAt: ago(31),
        isCurrent: false,
      },
    ],
  }),

  '/api/links': () => ({ links: links() }),

  '/api/links/trash/count': () => ({
    count: getMockTrash(readDemoDeleted()).length,
  }),
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function answer(method, path) {
  if (method === 'GET') {
    const read = READS[path]
    return read ? json(read()) : json({ error: 'Not in the demo' }, 404)
  }
  // The shell claims homepage links on every visit; a visitor has none.
  if (path === '/api/public/claim') return json({ claimed: 0 })
  return json({ error: DEMO_NOT_SAVED }, 403)
}

let installed = false

export function installDemoApi() {
  if (installed) return
  installed = true
  const real = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const target =
      typeof input === 'string' || input instanceof URL ? String(input) : input.url
    const url = new URL(target, window.location.href)
    if (
      url.origin !== window.location.origin ||
      !url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/api/auth/')
    ) {
      return real(input, init)
    }
    const method = (
      init?.method || (input instanceof Request ? input.method : 'GET')
    ).toUpperCase()
    return Promise.resolve(answer(method, url.pathname))
  }
}
