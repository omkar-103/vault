
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function checkSpaceUsage() {
    try {
        const db = await getDb();
        console.log('--- Database Space Usage Analysis ---');
        
        const collections = ['vaultitems', 'vaultitems2', 'vaultitems3', 'vaultitems4', 'vaultitems5', 'sessions', 'sessions2', 'sessions3', 'sessions4', 'sessions5'];
        
        for (const colName of collections) {
            const count = await db.collection(colName).countDocuments();
            console.log(`Collection ${colName}: ${count} documents`);
        }
        
        const imagesBucket = db.collection('vault_images.files');
        const imagesCount = await imagesBucket.countDocuments();
        const imagesSizeResult = await imagesBucket.aggregate([
            { $group: { _id: null, totalSize: { $sum: "$length" } } }
        ]).toArray();
        
        const totalSizeBytes = imagesSizeResult[0]?.totalSize || 0;
        const totalSizeMB = (totalSizeBytes / 1024 / 1024).toFixed(2);
        
        console.log(`\nGridFS (vault_images): ${imagesCount} files, Total Length Info: ${totalSizeMB} MB`);
        
        const stats = await db.command({ dbStats: 1 });
        console.log('\n--- Real MongoDB Atlas Stats ---');
        console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (stats.storageSize / 1024 / 1024 > 500) {
            console.warn('\n⚠️ WARNING: Your MongoDB Atlas Storage is full (512MB limit exceeded).');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking space usage:', error);
        process.exit(1);
    }
}

checkSpaceUsage();
