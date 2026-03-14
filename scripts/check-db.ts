// scripts/check-db.ts
// Lists all collections in the vault database and flags any that are not needed.
import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const NEEDED = new Set([
    'users',
    'sessions',    // Vault 1 sessions
    'sessions2',   // Vault 2 sessions
    'sessions3',   // Vault 3 sessions
    'vaultitems4', // Vault 4 data
    'sessions4',   // Vault 4 sessions
    'vaultitems5', // Vault 5 data
    'sessions5',   // Vault 5 sessions
    'vaultitems',  // Vault 1 items
    'vaultitems2', // Vault 2 items
    'vaultitems3', // Vault 3 items
    'fs.files',    // GridFS (images)
    'fs.chunks',   // GridFS (images)
])

async function main() {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('Missing MONGODB_URI')

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db('vault')

    const collections = await db.listCollections().toArray()
    const names = collections.map(c => c.name)

    console.log('\n=== Collections in "vault" database ===\n')

    const extras: string[] = []

    for (const name of names) {
        const isNeeded = NEEDED.has(name)
        const count = await db.collection(name).countDocuments()
        const tag = isNeeded ? '✅ NEEDED' : '❌ EXTRA '
        console.log(`  ${tag}  ${name.padEnd(20)} (${count} docs)`)
        if (!isNeeded) extras.push(name)
    }

    // Check for any needed collections that don't exist yet
    for (const needed of NEEDED) {
        if (!names.includes(needed)) {
            console.log(`  ⚠️  MISSING  ${needed.padEnd(20)} (not created yet — OK, created on first use)`)
        }
    }

    console.log('\n')

    if (extras.length === 0) {
        console.log('✅ No extra collections found. Database is clean.\n')
    } else {
        console.log(`❌ Found ${extras.length} extra collection(s): ${extras.join(', ')}`)
        console.log('   Run: npm run db:clean  to remove them.\n')
    }

    await client.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
