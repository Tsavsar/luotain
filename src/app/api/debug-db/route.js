// TEMPORARY diagnostic route — confirms what's ACTUALLY available at
// runtime, without guessing. Never logs the password. Delete this
// file once we've got an answer.

export async function GET() {
  const url = process.env.DATABASE_URL

  if (!url) {
    return Response.json({
      status: 'DATABASE_URL is completely missing at runtime',
    })
  }

  let hostname = 'could not parse'
  let port = 'could not parse'
  try {
    const parsed = new URL(url)
    hostname = parsed.hostname
    port = parsed.port
  } catch (err) {
    return Response.json({
      status: 'DATABASE_URL exists but failed to parse as a URL',
      length: url.length,
      firstChars: url.slice(0, 15),
    })
  }

  return Response.json({
    status: 'DATABASE_URL parsed successfully',
    hostname,
    port,
    length: url.length,
  })
}
