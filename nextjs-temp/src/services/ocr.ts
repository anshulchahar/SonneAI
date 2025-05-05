import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { validateFile } from '@/utils/fileValidation';

export class OCRService {
    private client: ComputerVisionClient;

    constructor() {
        // Initialize the Computer Vision client with Azure credentials
        const key = process.env.AZURE_COMPUTER_VISION_KEY;
        const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT;

        if (!key || !endpoint) {
            throw new Error('Azure Computer Vision API key or endpoint not found in environment variables');
        }

        // Remove trailing semicolons if present in the environment variables
        const cleanKey = key.replace(/;$/, '');
        const cleanEndpoint = endpoint.replace(/;$/, '');

        this.client = new ComputerVisionClient(
            new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': cleanKey } }),
            cleanEndpoint
        );
    }

    /**
     * Extract text from an image using Azure's OCR capabilities
     * @param imageBuffer The buffer containing the image data
     * @returns The extracted text as a string
     */
    async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
        try {
            // Call the Azure Computer Vision API for text recognition
            const result = await this.client.readInStream(imageBuffer);

            // Get operation ID from result for polling
            const operationLocation = result.operationLocation.split('/');
            const operationId = operationLocation.pop() || '';

            if (!operationId) {
                throw new Error('Failed to get operation ID from Azure OCR service');
            }

            // Poll for results until operation is complete
            let textResults;
            let status: string = 'notStarted';

            while (status !== 'succeeded' && status !== 'failed') {
                // Wait for a second before checking status again
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Get the current status of the operation
                const operationResult = await this.client.getReadResult(operationId);
                status = operationResult.status || 'failed';

                if (status === 'succeeded') {
                    textResults = operationResult.analyzeResult?.readResults;
                }
            }

            if (status === 'failed' || !textResults) {
                throw new Error('Azure OCR operation failed or returned no results');
            }

            // Concatenate all the text from the results
            let extractedText = '';
            for (const page of textResults) {
                for (const line of page.lines || []) {
                    extractedText += line.text + '\n';
                }
            }

            return extractedText.trim();
        } catch (error) {
            console.error('Error extracting text from image:', error);
            throw new Error(error instanceof Error
                ? `Failed to extract text from image: ${error.message}`
                : 'Failed to extract text from image: Unknown error');
        }
    }

    /**
     * Process a scanned PDF by first extracting its content as an image and then performing OCR
     * @param pdfBuffer The buffer containing the PDF data
     * @returns The extracted text as a string
     */
    async extractTextFromScannedPdf(pdfBuffer: Buffer): Promise<string> {
        try {
            // For PDFs, we need to extract each page as an image and process them
            // Note: This is a simplified version. In production, you would use a library like
            // pdf.js to convert each page to an image and then process each image

            // Since we can't easily convert PDF to images in this example, we'll just
            // pass the first page of the PDF as an "image" to demonstrate
            return await this.extractTextFromImage(pdfBuffer);

            // In a real implementation, you'd iterate through each page:
            // const pageImages = await convertPdfToImages(pdfBuffer);
            // let allText = '';
            // for (const pageImage of pageImages) {
            //   const pageText = await this.extractTextFromImage(pageImage);
            //   allText += pageText + '\n\n';
            // }
            // return allText.trim();
        } catch (error) {
            console.error('Error extracting text from scanned PDF:', error);
            throw new Error(error instanceof Error
                ? `Failed to extract text from scanned PDF: ${error.message}`
                : 'Failed to extract text from scanned PDF: Unknown error');
        }
    }

    /**
     * Process files for OCR text extraction
     * @param files Array of files to process
     * @returns Array of results containing extracted text and file information
     */
    async processFiles(files: File[]): Promise<{ text: string; info: { filename: string; character_count: number; } }[]> {
        try {
            const results = [];

            if (!files || files.length === 0) {
                throw new Error('No files provided for OCR processing');
            }

            for (const file of files) {
                try {
                    // Validate the file
                    const validation = validateFile(file);
                    if (!validation.isValid) {
                        console.error(`File validation failed for ${file.name}:`, validation.error);
                        throw new Error(`${file.name}: ${validation.error}`);
                    }

                    // Convert file to buffer
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    let text = '';

                    // Determine file type and process accordingly
                    if (file.type === 'application/pdf') {
                        text = await this.extractTextFromScannedPdf(buffer);
                    } else if (file.type.startsWith('image/')) {
                        text = await this.extractTextFromImage(buffer);
                    } else {
                        throw new Error(`Unsupported file type for OCR: ${file.type}`);
                    }

                    if (!text || !text.trim()) {
                        throw new Error(`${file.name}: No text content extracted from file`);
                    }

                    results.push({
                        text,
                        info: {
                            filename: file.name,
                            character_count: text.length,
                        },
                    });
                } catch (fileError) {
                    console.error(`Error processing file ${file.name}:`, fileError);
                    throw fileError;
                }
            }

            if (results.length === 0) {
                throw new Error('No valid files were processed for OCR');
            }

            return results;
        } catch (error) {
            console.error('OCR processing error:', error);
            throw error instanceof Error
                ? error
                : new Error('Unknown error during OCR processing');
        }
    }
}

// Create a singleton instance
const ocrService = new OCRService();
export default ocrService;