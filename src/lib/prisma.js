import dns from 'dns'

// ─── Force IPv4-first DNS resolution ───
// Since Node 18+, DNS resolution can prefer IPv6 when a hostname has
// both A and AAAA records — Supabase's pooler hostname does. If
// Vercel's serverless runtime doesn't have outbound IPv6 connectivity,
// every connection attempt fails identically no matter what else is
// configured correctly, which matches the 100%-reproducible pattern
// we've been seeing. This must run before any connection is opened.
dns.setDefaultResultOrder('ipv4first')

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
