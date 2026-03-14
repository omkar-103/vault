
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function main() {
    try {
        const db = await getDb();
        const vaults = ['sessions', 'sessions2', 'sessions3', 'sessions4', 'sessions5'];
        console.log('--- Active Sessions ---');
        for (const v of vaults) {
            const sessions = await db.collection(v).find({ active: true }).toArray();
            console.log(`${v}: ${sessions.length} active sessions`);
            sessions.forEach(s => {
                console.log(`  - Token: ${s.token.substring(0, 8)}..., Expires: ${s.expiresAt}`);
            });
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

main();
