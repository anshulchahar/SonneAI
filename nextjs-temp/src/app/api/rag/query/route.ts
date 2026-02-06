import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { RAGService } from '@/services/rag';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/rag/query - Ask a question against ingested documents (RAG)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            question,
            conversation_id,
            document_ids,
            match_count = 8,
        } = body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        const ragService = new RAGService();
        const result = await ragService.query(
            question.trim(),
            session.user.id,
            conversation_id,
            document_ids,
            match_count
        );

        return NextResponse.json({
            answer: result.answer,
            sources: result.sources.map((s) => ({
                document_id: s.document_id,
                filename: s.filename,
                chunk_index: s.chunk_index,
                similarity: s.similarity,
                snippet: s.chunk_content.slice(0, 300),
            })),
            conversation_id: result.conversation_id,
            message_id: result.message_id,
        });
    } catch (error) {
        console.error('Error in RAG query:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process query' },
            { status: 500 }
        );
    }
}
