import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ─── Shared Prisma singleton ───
// Instantiated ONCE, at module scope, and reused by every route that
// imports it. This is what lets a warm serverless function reuse the
// same underlying connection across requests instead of opening a
// brand-new one every single time — which is very likely what's been
// causing the intermittent "can't reach database server" errors,
// since a fresh connection has to be freshly negotiated every time.
//
// The globalThis guard exists for local dev specifically — without
// it, Next.js's hot-reload would create a fresh client (and orphan
// the old connection) on every file save.
//
// This is safe at module scope now (it wasn't always) because the
// actual reason instantiating things at module scope crashed the
// BUILD earlier was the generated client not existing yet — fixed
// separately via `prisma generate && next build`. That's a different
// problem from connection reuse at runtime.

const globalForPrisma = globalThis

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
