
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const STORAGE_DIR = path.join(process.cwd(), '_secure_data', 'vault5_files');

if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export async function storeFileLocally(
    filepath: string,
    filename: string,
    mimeType: string
): Promise<string> {
    const id = crypto.randomUUID();
    const targetPath = path.join(STORAGE_DIR, id);
    
    // Move the file from temp to our storage
    await fs.promises.rename(filepath, targetPath);
    
    // Store metadata in a JSON file
    const metadata = { filename, mimeType, createdAt: new Date() };
    await fs.promises.writeFile(`${targetPath}.meta.json`, JSON.stringify(metadata));
    
    return `local_${id}`;
}

export async function fetchLocalFile(fileId: string): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    filename: string;
    size: number;
} | null> {
    const id = fileId.replace('local_', '');
    const targetPath = path.join(STORAGE_DIR, id);
    const metaPath = `${targetPath}.meta.json`;
    
    if (!fs.existsSync(targetPath) || !fs.existsSync(metaPath)) {
        return null;
    }
    
    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const stats = fs.statSync(targetPath);
    
    return {
        stream: fs.createReadStream(targetPath),
        mimeType: metadata.mimeType,
        filename: metadata.filename,
        size: stats.size
    };
}

export async function removeLocalFile(fileId: string): Promise<void> {
    const id = fileId.replace('local_', '');
    const targetPath = path.join(STORAGE_DIR, id);
    const metaPath = `${targetPath}.meta.json`;
    
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
}
