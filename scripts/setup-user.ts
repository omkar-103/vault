// scripts/setup-user.ts
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'
import { initDb } from '../lib/db'

async function main() {
  const password = process.argv[2]

  if (!password || password.length < 12) {
    console.error(
      'Usage: npm run setup <password>\nPassword must be at least 12 characters.'
    )
    process.exit(1)
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI in .env.local')
    process.exit(1)
  }

  console.log('Connecting to MongoDB...')
  const client = new MongoClient(uri)
  await client.connect()

  const db = client.db('vault')

  // ── Hash password with bcrypt (12 rounds) ─────────────────────
  console.log('Hashing password...')
  const passwordHash = await bcrypt.hash(password, 12)

  // ── Replace any existing user ─────────────────────────────────
  await db.collection('users').deleteMany({})
  await db.collection('users').insertOne({
    passwordHash,
    failedAttempts: 0,
    lockUntil: null,
    createdAt: new Date(),
  })

  // ── Build DB indexes ──────────────────────────────────────────
  console.log('Building indexes...')
  await db.collection('sessions').createIndex({ token: 1 }, { unique: true })
  await db.collection('sessions').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  )
  await db.collection('vaultitems').createIndex({ createdAt: -1 })

  console.log('Done. Vault user created.')
  await client.close()
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})