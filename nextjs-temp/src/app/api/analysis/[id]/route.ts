import { NextResponse } from 'next/server';
import { withAuth } from '@/utils/apiMiddleware';
import { errorResponse } from '@/utils/apiUtils';
import { getCachedAnalysis, cacheAnalysisResult } from '@/utils/cache';
import { AnalysisResult } from '@/types/api';
import { supabaseAdmin } from '@/lib/supabase';

export const GET = withAuth(async (req, session) => {
    try {
        // Extract analysis ID from the URL
        const id = req.url.split('/').pop();

        if (!id) {
            return errorResponse('Analysis ID is required', 400);
        }

        // Check cache first
        const cachedAnalysis = getCachedAnalysis(id);
        if (cachedAnalysis) {
            return NextResponse.json(cachedAnalysis);
        }

        if (!session || !session.user || !session.user.id) {
            return errorResponse('User not authenticated', 401);
        }

        // Fetch analysis from database using Supabase
        const { data: analysis, error } = await supabaseAdmin
            .from('analysis')
            .select('*')
            .eq('id', id)
            .eq('userId', session.user.id)
            .single();

        if (error || !analysis) {
            return errorResponse('Analysis not found', 404);
        }

        // Parse stored analysis data
        let analysisData: AnalysisResult;

        try {
            // Parse the stored JSON data
            const parsedAnalysis = JSON.parse(analysis.analysis || '{}');
            const keyPoints = JSON.parse(analysis.keyPoints || '[]');

            // Construct the response
            analysisData = {
                summary: analysis.summary || '',
                keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
                detailedAnalysis: parsedAnalysis.detailedAnalysis || '',
                recommendations: parsedAnalysis.recommendations || '',
                documentComparison: parsedAnalysis.documentComparison || '',
                fileInfo: parsedAnalysis.fileInfo || [],
            };

            // Cache the result for future requests
            cacheAnalysisResult(id, analysisData);

        } catch (error) {
            console.error('Error parsing analysis data:', error);
            return errorResponse('Failed to parse analysis data', 500);
        }

        return NextResponse.json(analysisData);
    } catch (error) {
        console.error('Error fetching analysis details:', error);
        return errorResponse('Failed to fetch analysis details', 500);
    }
});