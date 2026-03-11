// pages/api/auth/terminate-others.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { invalidateOtherSessions } from '../../../lib/session'
import { getDb } from '../../../lib/db'

// Map each vault's cookie name → its sessions collection
const VAULT_MAP: Record<string, { cookie: string; collection: string }> = {
    '1': { cookie: 'vault_token', collection: 'sessions' },
    '2': { cookie: 'vault2_token', collection: 'sessions2' },
    '3': { cookie: 'vault3_token', collection: 'sessions3' },
    '4': { cookie: 'vault4_token', collection: 'sessions4' },
}

async function isValidToken(token: string, collection: string): Promise<boolean> {
    const db = await getDb()
    const session = await db.collection(collection).findOne({ token })
    if (!session || !session.active) return false
    if (new Date() > new Date(session.expiresAt)) return false
    return true
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') return res.status(404).end()

    // Which vault is calling — 1, 2, 3, or 4
    const vault = String(req.body?.vault ?? '1')
    const map = VAULT_MAP[vault]
    if (!map) return res.status(404).end()

    const token = req.cookies?.[map.cookie]
    if (!token) return res.status(404).end()

    const valid = await isValidToken(token, map.collection)
    if (!valid) return res.status(404).end()

    const count = await invalidateOtherSessions(token, map.collection)

    return res.status(200).json({ ok: true, terminated: count })
}
