// pages/api/pdf-search.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { getDb } from '../../lib/db'

// @ts-ignore
import PDFParser from 'pdf2json'

async function isVault2Authenticated(req: NextApiRequest): Promise<boolean> {
    const db = await getDb()
    const token = req.cookies?.['vault2_token']
    if (!token) return false
    const session = await db.collection('sessions2').findOne({ token })
    if (session && session.active && new Date() <= new Date(session.expiresAt)) {
        return true
    }
    return false
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') return res.status(404).end()

    // ── Auth gate (Vault 2 only) ───────────────────────────────────
    const authed = await isVault2Authenticated(req)
    if (!authed) return res.status(404).end()

    const { query } = req.body
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Missing query' })
    }

    const pdfPath = path.join(process.cwd(), '_secure_data', 'project_documentation_v1.pdf.pdf')

    if (!fs.existsSync(pdfPath)) {
        return res.status(404).end()
    }

    const pdfParser = new PDFParser(null, 1 as any);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error(errData.parserError);
        res.status(500).json({ error: 'Search failed' });
    });

    pdfParser.on("pdfParser_dataReady", pdfData => {
        const text = pdfParser.getRawTextContent()
        
        // Count occurrences (case-insensitive)
        const regex = new RegExp(
            // Escape special chars in search query
            query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 
            'gi'
        )
        
        const matches = text.match(regex)
        const count = matches ? matches.length : 0

        res.status(200).json({ count })
    });

    pdfParser.loadPDF(pdfPath);
}
