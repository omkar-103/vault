// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { getDb } from '../../../lib/db'
import { generateToken, createSession } from '../../../lib/session'

const COOKIE_NAME = 'vault_token'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  const { password } = req.body

  if (!password || typeof password !== 'string') {
    return res.status(404).end()
  }

  const db = await getDb()
  const user = await db.collection('users').findOne({})

  // No user setup yet → silent 404
  if (!user) return res.status(404).end()

  // ── Check lockout ─────────────────────────────────────────────
  if (user.lockUntil && new Date() < new Date(user.lockUntil)) {
    return res.status(404).end()
  }

  const isValid = await bcrypt.compare(password, user.passwordHash as string)

  if (!isValid) {
    const attempts = (user.failedAttempts as number ?? 0) + 1

    if (attempts >= 2) {
      // Lock for 24 hours; no hint to the caller
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            failedAttempts: attempts,
            lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        }
      )
    } else {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { failedAttempts: attempts } }
      )
    }

    return res.status(404).end()
  }

  // ── Success: reset attempts ───────────────────────────────────
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { failedAttempts: 0, lockUntil: null } }
  )

  const token = generateToken()
  const expiresAt = await createSession(token)

  const isProduction = process.env.NODE_ENV === 'production'

  res.setHeader(
    'Set-Cookie',
    [
      `${COOKIE_NAME}=${token}`,
      `HttpOnly`,
      isProduction ? `Secure` : '',
      `SameSite=Strict`,
      `Path=/`,
      `Expires=${expiresAt.toUTCString()}`,
    ]
      .filter(Boolean)
      .join('; ')
  )

  return res.status(200).json({ ok: true })
}