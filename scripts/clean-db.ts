// scripts/clean-db.ts
// Drops all collections in the vault database that are NOT in the needed list.
import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const NEEDED = new Set([
    'users',
    'sessions',
    'sessions2',
    'sessions3',
    'vaultitems4',
    'sessions4',
    'vaultitems5',
    'sessions5',
    'vaultitems',
    'vaultitems2',
    'vaultitems3',
    'fs.files',
    'fs.chunks',
    'vault_images.files',
    'vault_images.chunks',
])

async function main() {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('Missing MONGODB_URI')

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db('vault')

    const collections = await db.listCollections().toArray()
    const names = collections.map(c => c.name)

    const extras = names.filter(n => !NEEDED.has(n))

    if (extras.length === 0) {
        console.log('Database is already clean. Nothing to remove.')
        await client.close()
        return
    }

    console.log('Dropping extra collections:')
    for (const name of extras) {
        const count = await db.collection(name).countDocuments()
        await db.collection(name).drop()
        console.log(`  Dropped: ${name} (had ${count} docs)`)
    }

    console.log(`\nDone. Removed ${extras.length} extra collection(s).`)
    await client.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
