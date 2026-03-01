// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { invalidateSession } from '../../../lib/session'

const COOKIE_NAME = 'vault_token'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  const token = req.cookies?.[COOKIE_NAME]

  if (token) {
    await invalidateSession(token)
  }

  // Clear the cookie by setting expiry in the past
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  )

  return res.status(200).json({ ok: true })
}