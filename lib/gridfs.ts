// lib/gridfs.ts
import { GridFSBucket, ObjectId } from 'mongodb'
import { Readable } from 'stream'
import clientPromise from './db'

async function getBucket(): Promise<GridFSBucket> {
  const client = await clientPromise
  return new GridFSBucket(client.db('vault'), { bucketName: 'vault_images' })
}

export async function storeImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const bucket = await getBucket()

  return new Promise((resolve, reject) => {
    const readable = Readable.from(buffer)
    const upload = bucket.openUploadStream(filename, {
      metadata: { mimeType },
    })
    readable.pipe(upload)
    upload.on('finish', () => resolve((upload.id as ObjectId).toString()))
    upload.on('error', reject)
  })
}

export async function fetchImageStream(imageId: string): Promise<{
  stream: NodeJS.ReadableStream
  mimeType: string
} | null> {
  try {
    const bucket = await getBucket()
    const id = new ObjectId(imageId)
    const [file] = await bucket.find({ _id: id }).toArray()

    if (!file) return null

    return {
      stream: bucket.openDownloadStream(id),
      mimeType: (file.metadata?.mimeType as string) ?? 'image/jpeg',
    }
  } catch {
    return null
  }
}

export async function removeImage(imageId: string): Promise<void> {
  try {
    const bucket = await getBucket()
    await bucket.delete(new ObjectId(imageId))
  } catch {
    // Silently ignore
  }
}