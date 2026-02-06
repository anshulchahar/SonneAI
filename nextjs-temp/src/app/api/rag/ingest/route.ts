import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { RAGService } from '@/services/rag';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/rag/ingest - Upload and ingest a document for RAG
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Expected multipart/form-data request' },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        const ragService = new RAGService();
        const results = [];

        for (const file of files) {
            try {
                const buffer = await file.arrayBuffer();
                let text = '';
                let pageCount: number | undefined;

                // Extract text based on file type
                switch (file.type) {
                    case 'application/pdf': {
                        const pdfData = Buffer.from(buffer);
                        try {
                            // Import from lib/pdf-parse.js directly to bypass index.js
                            // which runs test code that triggers ENOENT in some Next.js contexts
                            const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
                            // Do NOT override pagerender — the default renderer extracts text properly
                            const result = await pdfParse(pdfData, { max: 0 });
                            text = result.text || '';
                            pageCount = result.numpages;
                        } catch (pdfError) {
                            console.error(`PDF parsing error for ${file.name}:`, pdfError);
                            throw new Error(`Unable to process "${file.name}". Please ensure the file is not password protected and contains readable text.`);
                        }
                        break;
                    }
                    case 'text/markdown':
                    case 'text/plain': {
                        text = new TextDecoder().decode(buffer);
                        break;
                    }
                    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                        const mammoth = (await import('mammoth')).default;
                        const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
                        text = result.value || '';
                        break;
                    }
                    default:
                        throw new Error(`Unsupported file type: ${file.type}`);
                }

                if (!text.trim()) {
                    throw new Error(`No text content could be extracted from "${file.name}". The file may be a scanned image, password-protected, or empty.`);
                }

                // Determine file type string
                const fileTypeMap: Record<string, string> = {
                    'application/pdf': 'pdf',
                    'text/markdown': 'markdown',
                    'text/plain': 'text',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                };

                const ingestionResult = await ragService.ingestDocument(
                    session.user.id,
                    file.name,
                    text,
                    fileTypeMap[file.type] || 'unknown',
                    file.size,
                    pageCount
                );

                results.push(ingestionResult);
                console.log(`Ingested: ${file.name} → ${ingestionResult.chunk_count} chunks`);
            } catch (fileError) {
                console.error(`Error ingesting ${file.name}:`, fileError);
                results.push({
                    document_id: null,
                    filename: file.name,
                    chunk_count: 0,
                    total_tokens: 0,
                    error: fileError instanceof Error ? fileError.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            success: true,
            documents: results,
            total_ingested: results.filter((r) => !('error' in r)).length,
        });
    } catch (error) {
        console.error('Error in RAG ingest:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to ingest documents' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/rag/ingest - List user's ingested documents
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ragService = new RAGService();
        const documents = await ragService.getUserDocuments(session.user.id);

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
