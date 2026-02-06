import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { RAGService } from '@/services/rag';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/rag/search - Semantic search across ingested documents
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            query,
            document_ids,
            match_count = 10,
            similarity_threshold = 0.4,
        } = body;

        if (!query || typeof query !== 'string' || !query.trim()) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        const ragService = new RAGService();
        const results = await ragService.searchDocuments(
            query.trim(),
            session.user.id,
            document_ids,
            match_count,
            similarity_threshold
        );

        return NextResponse.json({
            results: results.map((r) => ({
                document_id: r.document_id,
                filename: r.filename,
                chunk_index: r.chunk_index,
                content: r.chunk_content,
                similarity: r.similarity,
                metadata: r.chunk_metadata,
            })),
            total: results.length,
        });
    } catch (error) {
        console.error('Error in RAG search:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to search documents' },
            { status: 500 }
        );
    }
}
