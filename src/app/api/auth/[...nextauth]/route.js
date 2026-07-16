import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// NOTE: this one CAN'T move the client inside a function the same
// way — NextAuth's config object needs `adapter: PrismaAdapter(prisma)`
// available when the module loads, since NextAuth() itself is called
// at module scope here (that's just how the library is structured).
// If this specific file causes the same build error, the fix is
// different: wrap it in a try/catch at build-analysis time is not
// possible here, so instead this needs DATABASE_URL guaranteed
// present in ALL environments Vercel evaluates during build,
// including Preview — worth double-checking that scope specifically
// if this one still fails after the other two are fixed.
const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
})

export { handler as GET, handler as POST }
