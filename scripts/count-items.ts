
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function main() {
    try {
        const db = await getDb();
        const collections = ['vaultitems', 'vaultitems2', 'vaultitems3', 'vaultitems4', 'vaultitems5'];
        console.log('--- Vault Items ---');
        for (const v of collections) {
            const count = await db.collection(v).countDocuments();
            console.log(`${v}: ${count} documents`);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

main();
