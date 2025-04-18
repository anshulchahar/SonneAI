import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ANALYSIS_PROMPTS, ANALYSIS_OPTIONS } from '@/config/prompts';
import { AnalysisResult } from '@/types/api';

// Define a type for text content instead of using 'any'
type TextContent = {
    text: string;
};

// API versions to try in order
const API_VERSIONS = ["v1", "v1beta", "v1beta2", "v1beta3"];

// Model name variations to try
const MODEL_VARIATIONS = [
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
];

export class GeminiService {
    private apiKey: string;
    private modelName = 'gemini-2.0-flash'; // Using the model that's available according to ListModels response
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;

        // Log API key presence (not the actual key)
        console.log('Gemini API key check:', {
            isDefined: !!apiKey,
            length: apiKey ? apiKey.length : 0,
            firstChar: apiKey ? apiKey[0] : null,
            lastChars: apiKey ? `...${apiKey.slice(-3)}` : null
        });

        if (!apiKey) {
            throw new Error('Missing Gemini API key. Please check your environment variables.');
        }

        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    // Attempt to call Gemini API with multiple versions and model names
    private async callGeminiApiWithFallbacks(prompt: string): Promise<string> {
        let lastError = null;

        // First try the SDK approach
        try {
            console.log(`Trying SDK with model ${this.modelName}`);
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: ANALYSIS_OPTIONS.TEMPERATURE,
                    topP: ANALYSIS_OPTIONS.TOP_P,
                    maxOutputTokens: ANALYSIS_OPTIONS.MAX_OUTPUT_TOKENS,
                }
            });

            console.log('SDK call successful');
            return result.response.text();
        } catch (sdkError) {
            console.error('SDK approach failed:', sdkError);
            lastError = sdkError;
        }

        // If SDK fails, try direct API calls with different API versions and models
        for (const version of API_VERSIONS) {
            for (const model of MODEL_VARIATIONS) {
                try {
                    console.log(`Trying direct API call with ${version} and model ${model}`);
                    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${this.apiKey}`;

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: ANALYSIS_OPTIONS.TEMPERATURE,
                                maxOutputTokens: ANALYSIS_OPTIONS.MAX_OUTPUT_TOKENS,
                            }
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();

                        if (!data.candidates || !data.candidates[0]?.content?.parts) {
                            console.log(`Got response from ${version}/${model} but unexpected structure`);
                            continue;
                        }

                        const textContent = data.candidates[0].content.parts.find(
                            (part: TextContent) => part.text
                        );

                        if (!textContent || !textContent.text) {
                            console.log(`Got response from ${version}/${model} but no text content`);
                            continue;
                        }

                        console.log(`Successfully used ${version}/models/${model}`);

                        // Update the model name for future calls
                        this.modelName = model;
                        this.model = this.genAI.getGenerativeModel({ model });

                        return textContent.text;
                    } else {
                        const errorText = await response.text();
                        console.log(`Failed with ${version}/${model}: ${errorText}`);
                    }
                } catch (error) {
                    console.error(`Error with ${version}/${model}:`, error);
                    lastError = error;
                }
            }
        }

        // If we get here, all attempts failed
        throw lastError || new Error('Failed to call Gemini API with all attempted configurations');
    }

    // Process text documents and generate analysis
    async analyzeDocuments(documents: string[], customPrompt?: string | null, outputLength: number = 500): Promise<string> {
        try {
            console.log(`Using Gemini ${this.modelName} with API version v1 and output length ${outputLength}`);

            // Format the documents for the prompt
            const formattedDocs = documents.map((doc, i) =>
                `DOCUMENT ${i + 1}:\n${doc.slice(0, 15000)}`
            ).join('\n\n');

            // Get the base prompt based on document count
            let basePrompt = documents.length > 1
                ? ANALYSIS_PROMPTS.MULTIPLE_DOCUMENTS
                : ANALYSIS_PROMPTS.SINGLE_DOCUMENT;

            // Add custom prompt if provided
            if (customPrompt && customPrompt.trim()) {
                // Insert the custom prompt after the format specification but before the document
                const promptParts = basePrompt.split('Document:');
                if (promptParts.length === 2) {
                    basePrompt = `${promptParts[0]}User-Specified Instructions: ${customPrompt.trim()}\n\nDocument:${promptParts[1]}`;
                } else {
                    // For multiple documents case
                    const multiPartsSplit = basePrompt.split('Documents:');
                    if (multiPartsSplit.length === 2) {
                        basePrompt = `${multiPartsSplit[0]}User-Specified Instructions: ${customPrompt.trim()}\n\nDocuments:${multiPartsSplit[1]}`;
                    } else {
                        // Fallback - append to the end of the prompt
                        basePrompt = `${basePrompt}\n\nAdditional Instructions: ${customPrompt.trim()}`;
                    }
                }

                console.log('Added custom prompt to analysis instructions');
            }

            // Replace the document placeholder
            const prompt = basePrompt.replace('{text}', documents.length > 1 ? formattedDocs : documents[0]);

            // Calculate max tokens based on output length setting
            // Scale between 1024 tokens (brief) and 4096 tokens (detailed)
            const minTokens = 1024;
            const maxTokens = 4096;
            const scaleFactor = (outputLength - 100) / 900; // Convert from 100-1000 range to 0-1 range
            const maxOutputTokens = Math.round(minTokens + scaleFactor * (maxTokens - minTokens));

            console.log(`Using maxOutputTokens: ${maxOutputTokens} based on output length: ${outputLength}`);

            // Add output length instruction to the prompt
            const lengthInstruction = outputLength < 300
                ? "Provide a brief and concise analysis. Keep your response short."
                : outputLength > 700
                    ? "Provide a detailed and comprehensive analysis. Include extensive details."
                    : "Provide a balanced analysis with moderate detail.";

            const promptWithLengthInstructions = `${prompt}\n\nOutput Length Instructions: ${lengthInstruction}`;

            try {
                // First try using the SDK
                console.log('Attempting to use the Google Generative AI SDK...');

                const result = await this.model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: promptWithLengthInstructions }] }],
                    generationConfig: {
                        temperature: ANALYSIS_OPTIONS.TEMPERATURE,
                        maxOutputTokens: maxOutputTokens,
                    }
                });

                return result.response.text();
            } catch (sdkError) {
                // If SDK fails, fall back to direct API call
                console.error('SDK approach failed, falling back to direct API call:', sdkError);

                const url = `https://generativelanguage.googleapis.com/v1/models/${this.modelName}:generateContent?key=${this.apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptWithLengthInstructions }] }],
                        generationConfig: {
                            temperature: ANALYSIS_OPTIONS.TEMPERATURE,
                            maxOutputTokens: maxOutputTokens,
                        }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
                }

                const data = await response.json();

                // Extract text content
                if (!data.candidates || !data.candidates[0]?.content?.parts) {
                    throw new Error('Unexpected API response structure');
                }

                const textContent = data.candidates[0].content.parts.find(
                    (part: TextContent) => part.text
                );

                if (!textContent || !textContent.text) {
                    throw new Error('No text content found in the API response');
                }

                return textContent.text;
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }

    async extractMetadata(text: string): Promise<string> {
        try {
            if (!text) {
                throw new Error('No text provided for metadata extraction');
            }

            const prompt = ANALYSIS_PROMPTS.EXTRACT_METADATA;
            const promptText = prompt.replace('{text}', text);

            try {
                // Try using the SDK first
                console.log(`Using SDK with model ${this.modelName}`);
                const result = await this.model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: promptText }] }],
                    generationConfig: {
                        temperature: ANALYSIS_OPTIONS.TEMPERATURE,
                        topP: ANALYSIS_OPTIONS.TOP_P,
                        maxOutputTokens: ANALYSIS_OPTIONS.MAX_OUTPUT_TOKENS,
                    }
                });

                return result.response.text();
            } catch (sdkError) {
                console.error('SDK approach failed, trying direct API call:', sdkError);

                // Fall back to direct API call
                const url = `https://generativelanguage.googleapis.com/v1/models/${this.modelName}:generateContent?key=${this.apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        generationConfig: {
                            temperature: ANALYSIS_OPTIONS.TEMPERATURE,
                            topP: ANALYSIS_OPTIONS.TOP_P,
                            maxOutputTokens: ANALYSIS_OPTIONS.MAX_OUTPUT_TOKENS,
                        }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
                }

                const data = await response.json();
                if (!data.candidates || !data.candidates[0]?.content?.parts) {
                    throw new Error('Unexpected API response structure');
                }

                const textContent = data.candidates[0].content.parts.find(
                    (part: TextContent) => part.text
                );

                if (!textContent || !textContent.text) {
                    throw new Error('No text content found in the API response');
                }

                return textContent.text;
            }
        } catch (error) {
            console.error('Error extracting metadata with Gemini:', error);
            throw new Error(error instanceof Error
                ? `Failed to extract metadata: ${error.message}`
                : 'Failed to extract metadata: Unknown error');
        }
    }

    // Parse the analysis response
    static parseAnalysisResponse(text: string): AnalysisResult {
        const result: AnalysisResult = {
            summary: '',
            keyPoints: [],
            detailedAnalysis: '',
            recommendations: [],
            documentComparison: '',
            fileInfo: []
        };

        // Add logging to see what text we're trying to parse
        console.log('Raw response from Gemini API (first 500 chars):', text.substring(0, 500));

        try {
            // Extract summary
            const summaryMatch = text.match(/## Summary\s*\n([\s\S]*?)(?=\n## Key Points|\n## Detailed Analysis|$)/i);
            if (summaryMatch && summaryMatch[1]) {
                result.summary = summaryMatch[1].trim();
                console.log('Found summary section, length:', result.summary.length);
            } else {
                console.warn('No summary section found in response');
            }

            // Extract key points
            const keyPointsMatch = text.match(/## Key Points\s*\n([\s\S]*?)(?=\n## Detailed Analysis|$)/i);
            if (keyPointsMatch && keyPointsMatch[1]) {
                const keyPointsText = keyPointsMatch[1].trim();
                console.log('Found key points section, raw text:', keyPointsText);

                result.keyPoints = keyPointsText
                    .split('\n')
                    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('**'))
                    .map(point => point
                        .replace(/^[-*]+\s*/, '') // Remove any leading dashes or asterisks
                        .replace(/^\*\*\s*/, '') // Remove any leading ** specifically
                        .trim())
                    .filter(point => point.length > 0);

                console.log('Extracted key points count:', result.keyPoints.length);

                // If no bullet points found but there's content, try to parse it differently
                if (result.keyPoints.length === 0 && keyPointsText.length > 0) {
                    console.log('No bullet points found but content exists, trying alternate parsing');
                    // Split by newlines and filter out empty lines as a fallback
                    result.keyPoints = keyPointsText
                        .split('\n')
                        .map(line => line
                            .replace(/^[-*]+\s*/, '') // Remove any leading dashes or asterisks  
                            .replace(/^\*\*\s*/, '') // Remove any leading ** specifically
                            .trim())
                        .filter(line => line.length > 0);
                }
            } else {
                console.warn('No key points section found in response');
            }

            // Extract detailed analysis
            const detailedAnalysisMatch = text.match(/## Detailed Analysis\s*\n([\s\S]*?)(?=\n## Recommendations|$)/i);
            if (detailedAnalysisMatch && detailedAnalysisMatch[1]) {
                // Clean up the detailed analysis - replace bullet points with proper dashes
                const cleanedAnalysis = detailedAnalysisMatch[1]
                    .trim()
                    .replace(/^\*\*\s*([^*]+)/gm, '- $1') // Replace ** bullet points with -
                    .replace(/^\*\s*([^*]+)/gm, '- $1');  // Replace * bullet points with -

                result.detailedAnalysis = cleanedAnalysis;
                console.log('Found detailed analysis section, length:', result.detailedAnalysis.length);
            } else {
                console.warn('No detailed analysis section found in response');
            }

            // Extract recommendations
            const recommendationsMatch = text.match(/## Recommendations\s*\n([\s\S]*?)(?=\n## Document Comparison|$)/i);
            if (recommendationsMatch && recommendationsMatch[1]) {
                const recommendationsText = recommendationsMatch[1].trim();
                console.log('Found recommendations section raw text:', recommendationsText);

                // First try to find explicit bullet points or numbered items
                const bulletPointLines = recommendationsText
                    .split('\n')
                    .filter(line => {
                        const trimmed = line.trim();
                        return trimmed.startsWith('-') ||
                            trimmed.startsWith('*') ||
                            trimmed.startsWith('**') ||
                            /^\d+\.\s/.test(trimmed);
                    });

                if (bulletPointLines.length > 0) {
                    // We found bullet points, use them directly
                    console.log('Found bullet point recommendations:', bulletPointLines.length);
                    result.recommendations = bulletPointLines
                        .map(line => line
                            .replace(/^[-*]+\s*/, '') // Remove any leading dashes or asterisks
                            .replace(/^\*\*\s*/, '') // Remove any leading ** specifically
                            .replace(/^\d+\.\s*/, '') // Remove any leading numbers (1., 2., etc.)
                            .trim())
                        .filter(line => line.length > 0);
                } else {
                    // No explicit bullet points - check if it's a paragraph with multiple sentences
                    // Enhanced paragraph processing to split into separate bullet points
                    console.log('No bullet points found, processing paragraph into separate recommendations');

                    // Split paragraph into sentences
                    const sentenceRegex = /[^.!?]+[.!?]+(\s+|$)/g;
                    const sentences = [];
                    let match;

                    while ((match = sentenceRegex.exec(recommendationsText)) !== null) {
                        const sentence = match[0].trim();
                        // Don't add very short sentences that are likely not complete recommendations
                        if (sentence.length > 15) {
                            sentences.push(sentence);
                        }
                    }

                    if (sentences.length > 0) {
                        console.log(`Split paragraph into ${sentences.length} recommendation sentences`);
                        result.recommendations = sentences;
                    } else {
                        // Fallback to existing advanced parsing for complex cases
                        console.log('Sentence splitting failed, trying advanced parsing');

                        // Try to find recommendation patterns in the text
                        if (recommendationsText.includes("Start with") ||
                            recommendationsText.includes("Begin with") ||
                            recommendationsText.includes("Focus on") ||
                            recommendationsText.includes("Explore") ||
                            recommendationsText.includes("Use the")) {

                            // This likely has implicit recommendations with key phrases
                            // Look for common recommendation starter phrases and split on those
                            const recPrefixes = [
                                "Start with", "Begin with", "Focus on", "Explore",
                                "Use the", "Consider", "Ensure", "Implement", "Try to",
                                "For ", "Important", "Note"
                            ];

                            // Create a regex pattern from the prefixes
                            const patternStr = `(${recPrefixes.join('|')})`;
                            const pattern = new RegExp(patternStr, 'gi');

                            // Define a type for the regex matches
                            type RecommendationMatch = {
                                index: number;
                                prefix: string;
                            };

                            // Find all occurrences of recommendation starters
                            const allMatches: RecommendationMatch[] = [];
                            let matchPattern;

                            while ((matchPattern = pattern.exec(recommendationsText)) !== null) {
                                allMatches.push({
                                    index: matchPattern.index,
                                    prefix: matchPattern[0]
                                });
                            }

                            // Extract recommendations based on the matches
                            if (allMatches.length > 0) {
                                result.recommendations = allMatches.map((match, i) => {
                                    const start = match.index;
                                    const end = i < allMatches.length - 1 ? allMatches[i + 1].index : recommendationsText.length;
                                    const text = recommendationsText.substring(start, end).trim();
                                    return text;
                                });
                                console.log(`Split recommendations using key phrases, found ${result.recommendations.length} recommendations`);
                            } else {
                                // Fallback: split by sentences or paragraphs
                                const splitText = splitByParagraphsOrSentences(recommendationsText);
                                result.recommendations = splitText;
                                console.log(`Split by paragraphs/sentences, found ${result.recommendations.length} recommendations`);
                            }
                        } else {
                            // Try to split by paragraphs or sentences as a fallback
                            const splitText = splitByParagraphsOrSentences(recommendationsText);
                            result.recommendations = splitText;
                            console.log(`Split by paragraphs/sentences, found ${result.recommendations.length} recommendations`);
                        }
                    }
                }

                // Final safeguard: If we still only have one recommendation and it's long,
                // try to split it by sentences and colons
                if (result.recommendations.length === 1 && result.recommendations[0].length > 100) {
                    const longRec = result.recommendations[0];
                    console.log('Single long recommendation detected, attempting sentence-level splitting');
                    result.recommendations = splitIntoSentences(longRec);
                }

                console.log('Final extracted recommendations count:', result.recommendations.length);
            } else {
                console.warn('No recommendations section found in response');
            }

            // Helper function to split text into paragraphs or sentences
            function splitByParagraphsOrSentences(text: string): string[] {
                // First try paragraphs
                const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
                if (paragraphs.length > 1) {
                    return paragraphs;
                }

                // If only one paragraph or none, try splitting by sentences
                return splitIntoSentences(text);
            }

            // Helper function to split text into sentences
            function splitIntoSentences(text: string): string[] {
                // Use a proper sentence splitting approach
                const sentences: string[] = [];
                // Match sentences ending with ., !, or ? followed by space and capital letter or end of string
                const sentenceRegex = /[^.!?]+[.!?]+(\s+|$)/g;
                let match;

                while ((match = sentenceRegex.exec(text)) !== null) {
                    sentences.push(match[0].trim());
                }

                // If we couldn't extract any sentences, try another approach with colons
                if (sentences.length === 0) {
                    if (text.includes(':')) {
                        // Split by colons which often separate recommendations
                        const colonParts = text.split(':');
                        if (colonParts.length > 1) {
                            // The first part is likely a heading, so we keep it with the first item
                            const results = [colonParts[0] + ':' + colonParts[1]];

                            // Add remaining parts as separate recommendations
                            for (let i = 2; i < colonParts.length; i++) {
                                results.push(colonParts[i].trim());
                            }

                            return results.filter(s => s.length > 0);
                        }
                    }

                    // Try splitting by breaks implied by capital letters
                    const roughSentences = text.split(/\.\s+(?=[A-Z])/);
                    if (roughSentences.length > 1) {
                        return roughSentences.map(s => s.trim()).filter(s => s.length > 0);
                    }

                    // Last resort - return the whole text as one item
                    return [text];
                }

                return sentences.filter(s => s.length > 0);
            }

            // Extract document comparison if multiple documents
            const comparisonMatch = text.match(/## Document Comparison\s*\n([\s\S]*?)$/i);
            if (comparisonMatch && comparisonMatch[1]) {
                // Clean up the comparison text - replace bullet points with proper dashes
                const cleanedComparison = comparisonMatch[1]
                    .trim()
                    .replace(/^\*\*\s*([^*]+)/gm, '- $1') // Replace ** bullet points with -
                    .replace(/^\*\s*([^*]+)/gm, '- $1');  // Replace * bullet points with -

                result.documentComparison = cleanedComparison;
                console.log('Found document comparison section, length:', result.documentComparison.length);
            }

            // If everything is empty, fallback to simple text division
            if (!result.summary && !result.keyPoints.length && !result.detailedAnalysis && !result.recommendations.length) {
                console.warn('All sections are empty, applying fallback parsing');

                // Split the text into paragraphs
                const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

                if (paragraphs.length >= 3) {
                    result.summary = paragraphs[0];
                    result.keyPoints = [paragraphs[1]];
                    result.detailedAnalysis = paragraphs.slice(2).join('\n\n');
                } else if (paragraphs.length > 0) {
                    // Just put everything in summary if we don't have enough paragraphs
                    result.summary = paragraphs.join('\n\n');
                }
            }

        } catch (error) {
            console.error('Error parsing analysis response:', error);
        }

        return result;
    }
}