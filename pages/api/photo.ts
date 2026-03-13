// pages/api/photo.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { validateSession } from '../../lib/session'
import { fetchImageStream } from '../../lib/gridfs'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') return res.status(404).end()

  // ── Validate session first ─────────────────────────────────────
  const isAuthed = async () => {
    const { getDb } = await import('../../lib/db')
    const db = await getDb()
    
    const tokens = [
      { name: 'vault_token', coll: 'sessions' },
      { name: 'vault2_token', coll: 'sessions2' },
      { name: 'vault3_token', coll: 'sessions3' },
      { name: 'vault4_token', coll: 'sessions4' },
      { name: 'vault5_token', coll: 'sessions5' },
    ]

    for (const t of tokens) {
      const token = req.cookies?.[t.name]
      if (token) {
        const session = await db.collection(t.coll).findOne({ token, active: true })
        if (session && new Date() < new Date(session.expiresAt)) return true
      }
    }
    return false
  }

  if (!(await isAuthed())) return res.status(404).end()

  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(404).end()

  let result;
  if (id.startsWith('local_')) {
    const { fetchLocalFile } = await import('../../lib/storage')
    result = await fetchLocalFile(id)
  } else {
    result = await fetchImageStream(id)
  }
  
  if (!result) return res.status(404).end()

  // ── Block all caching — image must only load via live session ──
  res.setHeader('Content-Type', result.mimeType)
  res.setHeader('Content-Length', result.size.toString())
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  result.stream.pipe(res)

  result.stream.on('error', () => {
    if (!res.headersSent) res.status(404).end()
  })
}