
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function main() {
    try {
        const db = await getDb();
        console.log('Testing insert...');
        const res = await db.collection('vaultitems5').insertOne({ title: 'test_insert', createdAt: new Date() });
        console.log('Insert success:', res.insertedId);
        await db.collection('vaultitems5').deleteOne({ _id: res.insertedId });
        console.log('Delete success');
    } catch (err) {
        console.error('Test failed:', err);
    }
    process.exit(0);
}

main();
