
// pages/api/auth/logout5.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  const token = req.cookies?.['vault5_token']
  if (token) {
    const db = await getDb()
    await db.collection('sessions5').updateOne({ token }, { $set: { active: false } })
  }

  res.setHeader(
    'Set-Cookie',
    'vault5_token=; HttpOnly; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  return res.status(200).json({ ok: true })
}
