// pages/api/auth/login4.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { getDb } from '../../../lib/db'
import { generateToken } from '../../../lib/session'

const COOKIE_NAME = 'vault4_token'
const SESSIONS_COLLECTION = 'sessions4'

async function createSession4(token: string): Promise<Date> {
    const db = await getDb()
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    await db.collection(SESSIONS_COLLECTION).updateMany({}, { $set: { active: false } })
    await db.collection(SESSIONS_COLLECTION).insertOne({
        token,
        expiresAt,
        active: true,
        createdAt: new Date(),
    })
    return expiresAt
}

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

    if (!user) return res.status(404).end()

    if (user.lockUntil && new Date() < new Date(user.lockUntil)) {
        return res.status(404).end()
    }

    const isValid = await bcrypt.compare(password, user.passwordHash as string)

    if (!isValid) {
        const attempts = (user.failedAttempts as number ?? 0) + 1
        if (attempts >= 2) {
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { failedAttempts: attempts, lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
            )
        } else {
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { failedAttempts: attempts } }
            )
        }
        return res.status(404).end()
    }

    await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { failedAttempts: 0, lockUntil: null } }
    )

    const token = generateToken()
    const expiresAt = await createSession4(token)
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
