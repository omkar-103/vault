// lib/session.ts
import crypto from 'crypto'
import { getDb } from './db'

export function generateToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

export async function createSession(token: string): Promise<Date> {
  const db = await getDb()
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours

  // ── Single active session policy ──────────────────────────────
  await db.collection('sessions').updateMany({}, { $set: { active: false } })

  await db.collection('sessions').insertOne({
    token,
    expiresAt,
    active: true,
    createdAt: new Date(),
  })

  return expiresAt
}

export async function validateSession(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false

  const db = await getDb()
  const session = await db.collection('sessions').findOne({ token })

  if (!session || !session.active) return false

  if (new Date() > new Date(session.expiresAt)) {
    await db.collection('sessions').updateOne(
      { token },
      { $set: { active: false } }
    )
    return false
  }

  return true
}

export async function invalidateSession(token: string): Promise<void> {
  const db = await getDb()
  await db
    .collection('sessions')
    .updateOne({ token }, { $set: { active: false } })
}

export async function invalidateAllSessions(): Promise<void> {
  const db = await getDb()
  await db.collection('sessions').updateMany({}, { $set: { active: false } })
}

/**
 * Kills all active sessions in the given collection EXCEPT the caller's own.
 * Returns the count of sessions terminated.
 */
export async function invalidateOtherSessions(
  myToken: string,
  collection: string = 'sessions'
): Promise<number> {
  const db = await getDb()
  const result = await db
    .collection(collection)
    .updateMany(
      { token: { $ne: myToken }, active: true },
      { $set: { active: false } }
    )
  return result.modifiedCount
}