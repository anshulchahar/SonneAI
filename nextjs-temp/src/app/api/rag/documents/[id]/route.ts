import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { RAGService } from '@/services/rag';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/rag/documents/[id] - Delete a document and its chunks
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: documentId } = await params;
        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const ragService = new RAGService();
        const success = await ragService.deleteDocument(documentId, session.user.id);

        if (!success) {
            return NextResponse.json(
                { error: 'Document not found or you do not have permission to delete it' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete document' },
            { status: 500 }
        );
    }
}
