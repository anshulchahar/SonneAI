import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/utils/apiMiddleware';
import { AnalysisHistory } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export const GET = withAuth(async (req, session) => {
    try {
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user's analysis history
        const analyses = await prisma.analysis.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                filename: true,
                summary: true,
                createdAt: true,
            },
        });

        // Format the response
        const history: AnalysisHistory[] = analyses.map(analysis => ({
            id: analysis.id,
            filename: analysis.filename,
            summary: analysis.summary,
            createdAt: analysis.createdAt.toISOString(),
        }));

        return NextResponse.json(history);
    } catch (error) {
        console.error('Error fetching analysis history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analysis history' },
            { status: 500 }
        );
    }
});

export const DELETE = withAuth(async (req, session) => {
    try {
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get the analysis ID from the request URL
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Analysis ID is required' },
                { status: 400 }
            );
        }

        // Check if the analysis belongs to the user
        const analysis = await prisma.analysis.findUnique({
            where: {
                id,
            },
            select: {
                userId: true,
            },
        });

        if (!analysis) {
            return NextResponse.json(
                { error: 'Analysis not found' },
                { status: 404 }
            );
        }

        if (analysis.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Delete the analysis
        await prisma.analysis.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting analysis:', error);
        return NextResponse.json(
            { error: 'Failed to delete analysis' },
            { status: 500 }
        );
    }
});