
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function listVault5Items() {
    try {
        const db = await getDb();
        const items = await db.collection('vaultitems5').find({}).toArray();
        console.log('--- Vault 5 Items ---');
        items.forEach(item => {
            console.log(`ID: ${item._id}, Title: ${item.title}, Has Code: ${!!item.code}, FileID: ${item.fileId}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listVault5Items();
