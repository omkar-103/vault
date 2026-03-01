// lib/db.ts
import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!
if (!uri) throw new Error('Missing MONGODB_URI')

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise!
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export default clientPromise

export async function getDb(): Promise<Db> {
  const c = await clientPromise
  return c.db('vault')
}

/** Call once during setup to build indexes */
export async function initDb(): Promise<void> {
  const db = await getDb()
  await db.collection('sessions').createIndex({ token: 1 }, { unique: true })
  // TTL index: MongoDB auto-deletes expired session docs
  await db.collection('sessions').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  )
  await db.collection('vaultitems').createIndex({ createdAt: -1 })
}