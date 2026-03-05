// pages/api/auth/logout3.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getDb } from '../../../lib/db'

const COOKIE_NAME = 'vault3_token'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') return res.status(404).end()

    const token = req.cookies?.[COOKIE_NAME]

    if (token) {
        const db = await getDb()
        await db.collection('sessions3').updateOne({ token }, { $set: { active: false } })
    }

    res.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    )

    return res.status(200).json({ ok: true })
}
