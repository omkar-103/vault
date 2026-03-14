
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function main() {
    try {
        const db = await getDb();
        const items = await db.collection('vaultitems5').find({}).sort({ createdAt: -1 }).toArray();
        console.log('--- Latest Vault 5 Items ---');
        items.slice(0, 5).forEach(item => {
            console.log(JSON.stringify({
                _id: item._id,
                title: item.title,
                code: item.code ? (item.code.substring(0, 20) + '...') : null,
                fileId: item.fileId,
                createdAt: item.createdAt
            }, null, 2));
        });
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

main();
