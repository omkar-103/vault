
// pages/api/auth/logout5.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  res.setHeader(
    'Set-Cookie',
    'vault5_token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  return res.status(200).json({ ok: true })
}
