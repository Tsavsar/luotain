import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { setAppSession } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// authOptions is exported separately (not just passed inline to
// NextAuth()) so other server code — none currently, but useful if
// you ever need getServerSession elsewhere — can import the same config.
export const authOptions = {
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
  events: {
    // Fires after a successful OAuth sign-in. Sets the SAME
    // app-session cookie the email-code flow sets in verify-code —
    // this is what makes "who's logged in" consistent across both
    // auth methods, so onboarding/dashboard don't need two separate
    // checks for two separate session systems.
    async signIn({ user }) {
      if (user?.email) {
        await setAppSession(user.email)
      }
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
