// pages/api/auth/super-terminate.ts
// Kills ALL active sessions across ALL 4 vaults, EXCEPT the caller's own current session.
import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

const ALL_VAULTS = [
    { cookie: 'vault_token', collection: 'sessions' },
    { cookie: 'vault2_token', collection: 'sessions2' },
    { cookie: 'vault3_token', collection: 'sessions3' },
    { cookie: 'vault4_token', collection: 'sessions4' },
]

async function getValidToken(req: NextApiRequest): Promise<{ token: string; collection: string } | null> {
    const db = await getDb()
    for (const v of ALL_VAULTS) {
        const token = req.cookies?.[v.cookie]
        if (!token) continue
        const session = await db.collection(v.collection).findOne({ token })
        if (session && session.active && new Date() <= new Date(session.expiresAt)) {
            return { token, collection: v.collection }
        }
    }
    return null
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') return res.status(404).end()

    // ── Auth gate: must be logged into at least one vault ─────────
    const caller = await getValidToken(req)
    if (!caller) return res.status(404).end()

    const db = await getDb()
    let total = 0

    for (const v of ALL_VAULTS) {
        // For the caller's own vault: keep their own session alive
        // For the other 3 vaults: kill everything
        const filter =
            v.collection === caller.collection
                ? { token: { $ne: caller.token }, active: true }
                : { active: true }

        const result = await db
            .collection(v.collection)
            .updateMany(filter, { $set: { active: false } })

        total += result.modifiedCount
    }

    return res.status(200).json({ ok: true, terminated: total })
}
