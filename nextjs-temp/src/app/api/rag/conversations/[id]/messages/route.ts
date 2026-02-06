import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { RAGService } from '@/services/rag';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/rag/conversations/[id]/messages - Get messages for a conversation
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: conversationId } = await params;
        if (!conversationId) {
            return NextResponse.json(
                { error: 'Conversation ID is required' },
                { status: 400 }
            );
        }

        const ragService = new RAGService();
        const messages = await ragService.getConversationMessages(
            conversationId,
            session.user.id
        );

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}
