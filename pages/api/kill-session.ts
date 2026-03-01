// pages/api/kill-session.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { invalidateAllSessions } from '../../lib/session'

const COOKIE_NAME = 'vault_token'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  const { masterKey } = req.body

  if (
    !masterKey ||
    typeof masterKey !== 'string' ||
    masterKey !== process.env.MASTER_RESET_KEY
  ) {
    return res.status(404).end()
  }

  await invalidateAllSessions()

  // Also clear the caller's cookie immediately
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  )

  return res.status(200).json({ ok: true, message: 'All sessions killed.' })
}