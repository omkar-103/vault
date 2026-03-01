// pages/api/photo.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { validateSession } from '../../lib/session'
import { fetchImageStream } from '../../lib/gridfs'

const COOKIE_NAME = 'vault_token'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') return res.status(404).end()

  // ── Validate session first ─────────────────────────────────────
  const token = req.cookies?.[COOKIE_NAME]
  const authed = await validateSession(token)
  if (!authed) return res.status(404).end()

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(404).end()

  const result = await fetchImageStream(id)
  if (!result) return res.status(404).end()

  // ── Block all caching — image must only load via live session ──
  res.setHeader('Content-Type', result.mimeType)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  result.stream.pipe(res)

  result.stream.on('error', () => {
    if (!res.headersSent) res.status(404).end()
  })
}