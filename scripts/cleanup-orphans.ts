
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getDb } from '../lib/db';

async function cleanupOrphans() {
    try {
        const db = await getDb();
        console.log('--- Cleaning Up GridFS Orphans ---');
        
        const files = await db.collection('vault_images.files').find({}, { projection: { _id: 1 } }).toArray();
        const fileIds = files.map(f => f._id);
        
        console.log(`Found ${fileIds.length} valid files.`);
        
        const deleteResult = await db.collection('vault_images.chunks').deleteMany({
            files_id: { $nin: fileIds }
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} orphaned chunks.`);
        
        // Compact collection doesn't work on Atlas Free Tier usually, but we can try
        try {
            await db.command({ compact: 'vault_images.chunks' });
            console.log('Compacted chunks collection.');
        } catch (e) {
            console.log('Compact command not supported on this tier (expected).');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupOrphans();
