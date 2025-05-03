import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/apiMiddleware';
import { AnalysisHistory } from '@/types/api';
import { supabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, session) => {
    try {
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user's analysis history using Supabase instead of Prisma
        const { data: analyses, error } = await supabaseAdmin
            .from('analysis')
            .select('id, filename, summary, createdAt')
            .eq('userId', session.user.id)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Supabase error fetching analysis history:', error);
            return NextResponse.json(
                { error: 'Failed to fetch analysis history' },
                { status: 500 }
            );
        }

        // Format the response
        const history: AnalysisHistory[] = analyses.map(analysis => ({
            id: analysis.id,
            filename: analysis.filename,
            summary: analysis.summary,
            createdAt: analysis.createdAt,
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
        const { data: analysis, error: fetchError } = await supabaseAdmin
            .from('analysis')
            .select('userId')
            .eq('id', id)
            .single();

        if (fetchError || !analysis) {
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
        const { error: deleteError } = await supabaseAdmin
            .from('analysis')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting analysis:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete analysis' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting analysis:', error);
        return NextResponse.json(
            { error: 'Failed to delete analysis' },
            { status: 500 }
        );
    }
});