
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { getDb } from '../../../lib/db'
import { storeFileLocally } from '../../../lib/storage'

export const config = {
  api: {
    bodyParser: false,
  },
}

const COOKIE_NAME = 'vault5_token'
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1 GB

async function requireAuth(req: NextApiRequest): Promise<boolean> {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return false
    const db = await getDb()
    const session = await db.collection('sessions5').findOne({ token })
    if (!session || !session.active) return false
    if (new Date() > new Date(session.expiresAt)) return false
    return true
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  const authed = await requireAuth(req)
  if (!authed) return res.status(404).end()

  const form = formidable({ 
    maxFileSize: MAX_FILE_SIZE,
    maxTotalFileSize: MAX_FILE_SIZE,
    keepExtensions: true,
  })

  let fields: formidable.Fields
  let files: formidable.Files

  try {
    ;[fields, files] = await form.parse(req)
  } catch (err) {
    console.error('File parse error:', err)
    return res.status(500).json({ error: 'File too large or upload failed' })
  }

  const fileField = files['file']
  const file = Array.isArray(fileField) ? fileField[0] : fileField

  if (!file || !file.filepath) return res.status(404).end()

  try {
    const fileId = await storeFileLocally(
      file.filepath,
      file.originalFilename ?? 'upload',
      file.mimetype ?? 'application/octet-stream'
    )

    return res.status(200).json({ fileId })
  } catch (err) {
    console.error('GridFS store error:', err)
    return res.status(500).json({ error: 'Storage failed' })
  }
}
