import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { RAGService } from '@/services/rag';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/rag/conversations - List user's conversations
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ragService = new RAGService();
        const conversations = await ragService.getUserConversations(session.user.id);

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}
