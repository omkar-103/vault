
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function main() {
    try {
        const db = await getDb();
        const file = await db.collection('vault_images.files').findOne({});
        console.log('--- GridFS File ---');
        console.log(JSON.stringify(file, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

main();
