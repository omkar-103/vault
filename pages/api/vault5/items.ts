
// pages/api/vault5/items.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '../../../lib/db'

const COOKIE_NAME = 'vault5_token'
const COLLECTION = 'vaultitems5'

async function requireAuth(req: NextApiRequest): Promise<boolean> {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return false
    const db = await getDb()
    const session = await db.collection('sessions5').findOne({ token })
    if (!session || !session.active) return false
    if (new Date() > new Date(session.expiresAt)) {
        await db.collection('sessions5').updateOne({ token }, { $set: { active: false } })
        return false
    }
    return true
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const authed = await requireAuth(req)
    if (!authed) return res.status(404).end()

    const db = await getDb()

    // ── GET: list all items ───────────────────────────────────────
    if (req.method === 'GET') {
        const items = await db
            .collection(COLLECTION)
            .find({})
            .sort({ createdAt: -1 }) // Newest first for vault 5
            .toArray()

        const serialized = items.map(doc => ({
            _id: doc._id.toString(),
            title: doc.title,
            code: doc.code,
            fileId: doc.fileId ?? null,
            externalUrl: doc.externalUrl ?? null,
            createdAt: doc.createdAt,
        }))

        return res.status(200).json(serialized)
    }

    // ── POST: create item ─────────────────────────────────────────
    if (req.method === 'POST') {
        const { title, code, fileId, externalUrl } = req.body
        if (!title || typeof title !== 'string') return res.status(404).end()
        
        const doc = {
            title: title.trim(),
            code: code || '',
            fileId: fileId ?? null,
            externalUrl: externalUrl ?? null,
            createdAt: new Date(),
        }

        const result = await db.collection(COLLECTION).insertOne(doc)
        return res.status(201).json({ _id: result.insertedId.toString() })
    }

    // ── DELETE: remove item ───────────────────────────────────────
    if (req.method === 'DELETE') {
        const { id } = req.query
        if (!id || typeof id !== 'string') return res.status(404).end()

        let objectId: ObjectId
        try {
            objectId = new ObjectId(id)
        } catch {
            return res.status(404).end()
        }

        const doc = await db.collection(COLLECTION).findOne({ _id: objectId })
        if (!doc) return res.status(404).end()

        if (doc.fileId) {
            const fileId = doc.fileId as string
            if (fileId.startsWith('local_')) {
                const { removeLocalFile } = await import('../../../lib/storage')
                await removeLocalFile(fileId)
            } else {
                const { removeImage } = await import('../../../lib/gridfs')
                await removeImage(fileId)
            }
        }

        await db.collection(COLLECTION).deleteOne({ _id: objectId })
        return res.status(200).json({ ok: true })
    }

    return res.status(404).end()
}
