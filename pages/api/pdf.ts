// pages/api/pdf.ts
// Session-gated PDF server. The PDF file lives at public/doc.pdf
// but is served through this secure endpoint — direct URL access is blocked.
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getDb } from '../../lib/db'

const COOKIES = [
    { name: 'vault_token', collection: 'sessions' },
    { name: 'vault2_token', collection: 'sessions2' },
    { name: 'vault3_token', collection: 'sessions3' },
]

async function isAuthenticated(req: NextApiRequest): Promise<boolean> {
    const db = await getDb()
    for (const { name, collection } of COOKIES) {
        const token = req.cookies?.[name]
        if (!token) continue
        const session = await db.collection(collection).findOne({ token })
        if (session && session.active && new Date() <= new Date(session.expiresAt)) {
            return true
        }
    }
    return false
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') return res.status(404).end()

    // ── Auth gate ──────────────────────────────────────────────────
    const authed = await isAuthenticated(req)
    if (!authed) return res.status(404).end()

    // ── Serve the PDF ──────────────────────────────────────────────
    const pdfPath = path.join(process.cwd(), 'public', 'doc.pdf')

    if (!fs.existsSync(pdfPath)) {
        return res.status(404).end()
    }

    const stat = fs.statSync(pdfPath)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="doc.pdf"')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Cache-Control', 'no-store, no-cache')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    const stream = fs.createReadStream(pdfPath)
    stream.pipe(res)
}
