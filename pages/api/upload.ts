// pages/api/upload.ts 
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { validateSession } from '../../lib/session'
import { storeImage } from '../../lib/gridfs'

export const config = {
  api: {
    // Disable Next.js body parsing — formidable handles it
    bodyParser: false,
  },
}

const COOKIE_NAME = 'vault_token'
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(404).end()

  const token = req.cookies?.[COOKIE_NAME]
  const authed = await validateSession(token)
  if (!authed) return res.status(404).end()

  const form = formidable({ maxFileSize: MAX_FILE_SIZE })

  let fields: formidable.Fields
  let files: formidable.Files

  try {
    ;[fields, files] = await form.parse(req)
  } catch {
    return res.status(404).end()
  }

  // formidable v3 returns arrays
  const imageField = files['image']
  const file = Array.isArray(imageField) ? imageField[0] : imageField

  if (!file || !file.filepath) return res.status(404).end()

  // Validate it's actually an image
  const mime = file.mimetype ?? ''
  if (!mime.startsWith('image/')) return res.status(404).end()

  try {
    const buffer = fs.readFileSync(file.filepath)
    const imageId = await storeImage(
      buffer,
      file.originalFilename ?? 'upload',
      mime
    )

    // Clean up temp file
    fs.unlinkSync(file.filepath)

    return res.status(200).json({ imageId })
  } catch {
    return res.status(404).end()
  }
}