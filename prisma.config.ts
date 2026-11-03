import { config } from 'dotenv'
config({ path: '.env.local' })

import { defineConfig } from 'prisma/config'

// The unpooled connection, for migrations. A build only runs `prisma
// generate`, which reads the schema and never connects, so this file has to
// load even where no database is configured — Vercel's Preview environment
// has none. env('DIRECT_URL') threw there, and every pull request's preview
// failed before the app compiled. Without a URL the datasource is left out:
// generate still works, and anything that does need the database (migrate,
// db push) says plainly that it has no URL.
const url = process.env.DIRECT_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(url ? { datasource: { url } } : {}),
})
