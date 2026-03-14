
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function main() {
    try {
        const db = await getDb();
        const collections = await db.listCollections().toArray();
        console.log('--- Collection Info ---');
        for (const col of collections) {
            const stats = await db.command({ collStats: col.name });
            console.log(`${col.name}: ${stats.count} docs, size: ${(stats.size / 1024 / 1024).toFixed(2)} MB, storageSize: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

main();
