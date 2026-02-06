import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getOCRService } from '@/services/ocr';
import { GeminiService } from '@/services/gemini';
import { AnalysisResult } from '@/types/api';

export async function POST(req: NextRequest) {
    try {
        console.log('OCR endpoint called');

        // Check if the request is multipart/form-data
        const contentType = req.headers.get('content-type');
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Expected multipart/form-data request' },
                { status: 400 }
            );
        }

        // Parse form data
        let formData;
        try {
            formData = await req.formData();
        } catch (formError) {
            console.error('Error parsing form data:', formError);
            return NextResponse.json(
                { error: 'Failed to parse form data' },
                { status: 400 }
            );
        }

        // Get files
        const files = formData.getAll('files') as File[];
        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        // Filter files for OCR-compatible types (images and PDFs)
        const ocrCompatibleFiles = files.filter(
            file => file.type === 'application/pdf' || file.type.startsWith('image/')
        );

        if (ocrCompatibleFiles.length === 0) {
            return NextResponse.json(
                { error: 'No OCR-compatible files provided. Please upload PDFs or images.' },
                { status: 400 }
            );
        }

        console.log(`Processing ${ocrCompatibleFiles.length} files for OCR:`,
            ocrCompatibleFiles.map(f => `${f.name} (${f.size} bytes, type: ${f.type})`));

        try {
            // Process files with the OCR service
            const processedFiles = await ocrService.processFiles(ocrCompatibleFiles);

            // Combine all extracted text for Gemini analysis
            const extractedTexts = processedFiles.map(file => file.text);

            // Initialize Gemini service for analysis
            let analysisResult: AnalysisResult | null = null;
            try {
                console.log('Initializing Gemini service for OCR text analysis...');
                const geminiService = new GeminiService();

                // Get output length from form data or use default
                const outputLength = formData.get('outputLength') ?
                    parseInt(formData.get('outputLength') as string, 10) :
                    500;

                // Get custom prompt from form data if present
                const customPrompt = formData.get('customPrompt') as string || null;

                console.log(`Sending ${extractedTexts.length} OCR documents to Gemini API for analysis with output length: ${outputLength}...`);
                const analysisText = await geminiService.analyzeDocuments(extractedTexts, customPrompt, outputLength);

                console.log('Parsing Gemini analysis response for OCR text...');
                analysisResult = GeminiService.parseAnalysisResponse(analysisText);
            } catch (geminiError) {
                console.error('Error with Gemini analysis of OCR text:', geminiError);
                // Continue with original OCR results even if Gemini analysis fails
            }

            // Create the result object with OCR results and Gemini analysis
            const result = {
                results: processedFiles,
                message: 'OCR processing completed successfully',
                analysis: analysisResult
            };

            // Save to database if user is authenticated
            try {
                const session = await getServerSession(authOptions);

                if (session?.user?.id) {
                    // Combine all extracted text for database summary
                    const combinedText = processedFiles.map(file => file.text).join('\n\n');

                    // Get summary from Gemini analysis if available, or use default
                    const summary = analysisResult?.summary || 'Text extracted using OCR technology';

                    // Get key points from Gemini analysis if available, or use default
                    const keyPoints = analysisResult?.keyPoints && analysisResult.keyPoints.length > 0
                        ? analysisResult.keyPoints
                        : ['Text extracted using Azure Computer Vision OCR'];

                    // Store in database
                    const { error } = await supabaseAdmin
                        .from('analysis')
                        .insert({
                            id: uuidv4(),
                            userId: session.user.id,
                            filename: ocrCompatibleFiles.map(f => f.name).join(', '),
                            summary: summary,
                            keyPoints: JSON.stringify(keyPoints),
                            analysis: JSON.stringify({
                                summary: summary,
                                detailedAnalysis: analysisResult?.detailedAnalysis || combinedText,
                                fileInfo: processedFiles.map(file => file.info),
                                ocrProcessed: true,
                                recommendations: analysisResult?.recommendations || [],
                                keyPoints: keyPoints
                            })
                        });

                    if (error) {
                        console.error('Supabase error saving OCR results:', error);
                    } else {
                        console.log('OCR results with Gemini analysis saved to database for user:', session.user.id);
                    }
                }
            } catch (dbError) {
                console.error('Database error (non-critical):', dbError);
                // Continue - DB errors shouldn't prevent returning the OCR results
            }

            console.log('Returning OCR processing results with Gemini analysis');
            return NextResponse.json(result);

        } catch (ocrError) {
            console.error('Error during OCR processing:', ocrError);
            return NextResponse.json(
                {
                    error: 'OCR processing failed',
                    details: ocrError instanceof Error ? ocrError.message : 'Unknown error during OCR processing'
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Unhandled error in OCR route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred during OCR processing' },
            { status: 500 }
        );
    }
}