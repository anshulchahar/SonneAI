import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/config/auth';
import { GeminiService } from '@/services/gemini';
import mammoth from 'mammoth';

import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { checkAnalysisLimit } from '@/utils/usageLimits';

// File type constants
const FILE_TYPES = {
    PDF: 'application/pdf',
    MARKDOWN: 'text/markdown',
    TEXT: 'text/plain',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function POST(req: NextRequest) {
    try {
        console.log('Complete analyze endpoint called');

        // Check authentication and usage limits
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            const usageStatus = await checkAnalysisLimit(session.user.id);
            if (usageStatus.limitReached) {
                return NextResponse.json(
                    {
                        error: 'Usage limit reached',
                        message: `You have reached the maximum of ${usageStatus.limit} analyses. Please delete an existing analysis to create a new one.`,
                        usage: usageStatus,
                    },
                    { status: 429 }
                );
            }
        }

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

        // Get files - support both 'pdfFiles' (legacy) and 'files' (new consistent key)
        let files = formData.getAll('files') as File[];
        if (!files || files.length === 0) {
            // Try the legacy key as fallback
            files = formData.getAll('pdfFiles') as File[];
            if (!files || files.length === 0) {
                return NextResponse.json(
                    { error: 'No files provided' },
                    { status: 400 }
                );
            }
        }

        // Get custom prompt if provided
        const customPrompt = formData.get('customPrompt') as string | null;
        console.log(`Custom prompt provided: ${customPrompt ? 'Yes' : 'No'}`);

        // Get output length if provided (default to 500 if not specified)
        const outputLengthStr = formData.get('outputLength') as string | null;
        const outputLength = outputLengthStr ? parseInt(outputLengthStr, 10) : 500;
        console.log(`Output length setting: ${outputLength}`);

        console.log(`Processing ${files.length} files:`, files.map(f => `${f.name} (${f.size} bytes, type: ${f.type})`));

        try {
            // Process files based on their type
            const processedFiles = await Promise.all(files.map(async (file) => {
                try {
                    const buffer = await file.arrayBuffer();
                    let text = '';

                    switch (file.type) {
                        case FILE_TYPES.PDF:
                            return await processPdfFile(file, buffer);

                        case FILE_TYPES.MARKDOWN:
                            text = await processMarkdownFile(buffer);
                            return createFileResult(file, text, 1);

                        case FILE_TYPES.TEXT:
                            text = await processTextFile(buffer);
                            return createFileResult(file, text, 1);

                        case FILE_TYPES.DOCX:
                            return await processDocxFile(file, buffer);

                        default:
                            throw new Error(`Unsupported file type: ${file.type}`);
                    }
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);

                    // Handle the specific PDF processing error
                    if (error instanceof Error && error.message === 'PDF_CANNOT_BE_PROCESSED') {
                        throw new Error('PDF_CANNOT_BE_PROCESSED');
                    }

                    throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }));

            // Extract texts to pass to Gemini
            const texts = processedFiles.map(file => file.text);
            const fileInfo = processedFiles.map(file => file.info);

            // Analyze with Gemini
            let analysisResult;
            try {
                console.log('Initializing Gemini service...');
                const geminiService = new GeminiService();

                console.log(`Sending ${texts.length} documents to Gemini API for analysis with output length: ${outputLength}...`);
                const analysisText = await geminiService.analyzeDocuments(texts, customPrompt, outputLength);

                console.log('Parsing Gemini analysis response...');
                analysisResult = GeminiService.parseAnalysisResponse(analysisText);
            } catch (geminiError) {
                console.error('Error with Gemini analysis:', geminiError);
                return NextResponse.json(
                    { error: geminiError instanceof Error ? geminiError.message : 'Failed to analyze documents with AI' },
                    { status: 500 }
                );
            }

            // Create final result
            const result = {
                ...analysisResult,
                fileInfo,
                customPromptUsed: !!customPrompt // Add flag to indicate if a custom prompt was used
            };

            // Get session for database storage
            try {
                const session = await getServerSession(authOptions);

                // Save to database if user is authenticated
                if (session?.user?.id) {
                    // Store the customPrompt in the analysis JSON data instead of as a separate field
                    const analysisData = {
                        ...result,
                        customPrompt: customPrompt || ""
                    };

                    const { error } = await supabaseAdmin
                        .from('analysis')
                        .insert({
                            id: uuidv4(),
                            userId: session.user.id,
                            filename: files.map(f => f.name).join(', '),
                            summary: result.summary,
                            keyPoints: JSON.stringify(result.keyPoints),
                            analysis: JSON.stringify(analysisData)
                        });

                    if (error) {
                        console.error('Supabase error saving analysis:', error);
                    } else {
                        console.log('Analysis saved to database for user:', session.user.id);
                    }
                }

            } catch (dbError) {
                console.error('Database error (non-critical):', dbError);
                // Continue - DB errors shouldn't prevent returning the analysis
            }

            console.log('Returning complete analysis response');
            return NextResponse.json(result);

        } catch (error) {
            if (error instanceof Error && error.message === 'PDF_CANNOT_BE_PROCESSED') {
                return NextResponse.json(
                    {
                        error: 'PDF cannot be processed',
                        details: 'File may be password protected, is a scanned image or corrupt.'
                    },
                    { status: 400 }
                );
            }
            throw error;
        }

    } catch (error) {
        console.error('Unhandled error in analyze-complete route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred during analysis' },
            { status: 500 }
        );
    }
}

// Helper function to create a consistent file result object
function createFileResult(file: File, text: string, pageCount: number) {
    return {
        text,
        info: {
            filename: file.name,
            character_count: text.length,
            page_count: pageCount
        }
    };
}

// Process PDF files
async function processPdfFile(file: File, buffer: ArrayBuffer) {
    try {
        // Convert to Buffer instead of Uint8Array for pdf-parse
        const pdfData = Buffer.from(buffer);

        // Dynamically import pdf-parse with proper options
        const pdfParse = (await import('pdf-parse')).default;

        // Use options to avoid file system dependency issues
        const result = await pdfParse(pdfData, {
            // Use pagerender instead of renderPdf
            pagerender: () => '',    // Don't attempt to render pages
            max: 0                   // No page limitation
        });

        // Check if we got any text content
        if (!result.text || result.text.trim().length === 0) {
            console.warn(`PDF extraction resulted in empty text for ${file.name}`);
            throw new Error('PDF extraction resulted in empty text');
        }

        return createFileResult(file, result.text, result.numpages);
    } catch (error) {
        console.error(`PDF parsing error for ${file.name}:`, error);

        // Only throw PDF_CANNOT_BE_PROCESSED if the API call contains ENOENT
        if (error instanceof Error && error.message === 'ENOENT') {
            throw new Error('PDF_CANNOT_BE_PROCESSED');
        }

        // For other errors, return a simple error message
        return createFileResult(file, `Unable to process "${file.name}". Please ensure the file is not password protected and contains readable text.`, 1);
    }
}

// Process Markdown files
async function processMarkdownFile(buffer: ArrayBuffer): Promise<string> {
    // Convert buffer to string (UTF-8 is standard for markdown)
    const decoder = new TextDecoder('utf-8');
    const markdownText = decoder.decode(buffer);

    // We'll return the original markdown for better analysis context
    return markdownText;
}

// Process plain text files
async function processTextFile(buffer: ArrayBuffer): Promise<string> {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
}

// Process DOCX files
async function processDocxFile(file: File, buffer: ArrayBuffer) {
    try {
        // Convert the buffer to a Node.js Buffer for mammoth
        const nodeBuffer = Buffer.from(buffer);

        // Extract text from the DOCX
        const result = await mammoth.extractRawText({
            buffer: nodeBuffer
        });

        // Check if we got any text content
        if (!result.value || result.value.trim().length === 0) {
            console.warn(`DOCX extraction resulted in empty text for ${file.name}`);
            throw new Error('DOCX extraction resulted in empty text');
        }

        return createFileResult(file, result.value, 1); // DOCX doesn't have a standard page count
    } catch (error) {
        console.error(`DOCX parsing error for ${file.name}:`, error);

        // Instead of failing completely, provide a helpful message that can be analyzed
        const errorMessage = `
The document, "${file.name}," is inaccessible due to an extraction error encountered by the library used to process it. 
The error was: ${error instanceof Error ? error.message : 'Unknown error'}

This could be due to:
1. The DOCX file being password protected
2. The DOCX file containing complex elements that couldn't be processed
3. Corruption in the DOCX file structure
4. Incompatible format version

Please try:
- Ensuring the DOCX is not password protected
- Saving the document as a simpler DOCX format
- Converting to a different format like PDF or plain text
`;

        // Return the error message as text to be analyzed
        return createFileResult(file, errorMessage, 1);
    }
}