import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE = 'app-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// How stale lastActiveAt is allowed to get before it's rewritten. Without a
// throttle this would be a database write on every authenticated request,
// which is a real cost for a value only the sessions screen reads — and it
// only needs to be accurate to the minute.
const ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000

// Coarse location from the request. Vercel resolves this at the edge and
// passes it as headers, so there's no lookup service to call and no IP to
// store. Null everywhere else, including local development, which the UI
// already handles by omitting the segment.
async function requestContext() {
  try {
    const h = await headers()
    const decode = (v) => {
      if (!v) return null
      // Vercel percent-encodes these, so "S%C3%A3o Paulo" arrives escaped.
      try {
        return decodeURIComponent(v)
      } catch {
        return v
      }
    }
    return {
      userAgent: h.get('user-agent') || null,
      city: decode(h.get('x-vercel-ip-city')),
      country: decode(h.get('x-vercel-ip-country')),
    }
  } catch {
    // headers() throws outside a request scope. Recording a session isn't
    // worth failing a sign-in over.
    return { userAgent: null, city: null, country: null }
  }
}

// ─── Set the shared app session ───
// Called from BOTH auth paths — verify-code directly, and NextAuth's signIn
// event for OAuth — so "who's logged in" means the same thing regardless of
// which method someone used.
//
// The token now carries a `jti` matching a row in AppSession. That's what
// makes a session listable and revocable: previously the JWT was entirely
// self-contained, so nothing knew a session existed and deleting anything
// had no effect on it.
export async function setAppSession(email) {
  const jti = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

  // The row is written before the cookie is set. The other order would risk
  // handing out a token whose row doesn't exist, which getCurrentUserEmail
  // would then correctly reject — locking someone out of the sign-in they
  // just completed.
  try {
    // Same timeout treatment as the read path, for the same reason: without
    // it, an unreachable database would hang the sign-in itself rather than
    // just failing to record the session. Recording is worth having; it is
    // not worth blocking someone from signing in.
    await Promise.race([
      (async () => {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })
        if (!user) return
        const ctx = await requestContext()
        await prisma.appSession.create({
          data: {
            jti,
            userId: user.id,
            userAgent: ctx.userAgent,
            city: ctx.city,
            country: ctx.country,
            expiresAt,
          },
        })
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('session record timed out')), 2500)
      ),
    ])
  } catch (err) {
    // A failure here means the session won't be listed or revocable, which
    // is bad — but blocking sign-in over it is worse. Logged so it's visible
    // rather than silent.
    console.error('setAppSession: could not record session', err)
  }

  const token = jwt.sign({ email, jti }, process.env.NEXTAUTH_SECRET, {
    expiresIn: '30d',
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

// ─── Read the current user's email from the shared session ───
// Returns null if there's no session, or it's invalid, expired, or has been
// revoked — callers should treat all of those as "not logged in".
//
// Verifying the signature is no longer sufficient on its own. A signed JWT
// stays valid until it expires, so without the row check below, signing a
// device out would appear to work and change nothing.
export async function getCurrentUserEmail() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  let decoded
  try {
    decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
  } catch (err) {
    return null
  }

  // Tokens issued before this change have no jti. Accepted rather than
  // rejected, so deploying this doesn't sign everyone out — they simply
  // aren't revocable until their next sign-in issues a new one.
  if (!decoded.jti) return decoded.email

  try {
    // Raced against a timeout, not just wrapped in try/catch.
    //
    // This is the important part: getCurrentUserEmail runs on EVERY
    // authenticated request, and it used to be pure signature verification
    // with no database access. Adding a lookup put every page behind a
    // database round trip — and a catch only helps if the query THROWS. An
    // unreachable or slow pooler makes Prisma hang instead, which takes the
    // whole page down with it rather than degrading.
    //
    // 1.5s is well beyond a healthy query (single-digit milliseconds on an
    // indexed unique column) and well inside a page's patience. Past that,
    // fall through to trusting the signature: revocation is briefly delayed,
    // which is a far better failure than the app not loading.
    const session = await Promise.race([
      prisma.appSession.findUnique({
        where: { jti: decoded.jti },
        select: { id: true, expiresAt: true, lastActiveAt: true },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('session lookup timed out')), 1500)
      ),
    ])

    // Deleted means revoked. This is the line that makes "Sign out" on
    // another device actually do something.
    if (!session) return null
    if (session.expiresAt < new Date()) return null

    // Throttled, and deliberately not awaited — the caller is waiting on
    // this to render a page, and an activity timestamp isn't worth adding a
    // write to that path.
    if (
      Date.now() - session.lastActiveAt.getTime() >
      ACTIVITY_WRITE_INTERVAL_MS
    ) {
      prisma.appSession
        .update({
          where: { id: session.id },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {})
    }

    return decoded.email
  } catch (err) {
    // Unreachable, slow, or timed out — fall back to trusting the signature.
    // The alternative is signing every user out during a database blip,
    // which turns a degraded database into a total outage.
    console.error('getCurrentUserEmail: session lookup failed', err.message)
    return decoded.email
  }
}

// ─── The current session's id ───
// Used by the sessions screen to mark which row is this device. Returns the
// jti rather than the token, so nothing has to compare secrets.
export async function getCurrentSessionJti() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET).jti || null
  } catch {
    return null
  }
}

// ─── Clear the session ───
// Deletes the row as well as the cookie. Without the delete, signing out
// would leave a live session listed on every other device.
export async function clearAppSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
      if (decoded.jti) {
        await prisma.appSession.deleteMany({ where: { jti: decoded.jti } })
      }
    } catch {
      // An unverifiable token has no row worth deleting.
    }
  }

  cookieStore.delete(SESSION_COOKIE)
}
