import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBEDDING_MODEL = 'text-embedding-004';
const MAX_BATCH_SIZE = 100; // Gemini batch limit
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

export class EmbeddingService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY environment variable');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Generate an embedding for a single text string
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }

    /**
     * Generate embeddings for multiple texts in batches
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const model = this.genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const embeddings: number[][] = [];

        // Process in batches
        for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
            const batch = texts.slice(i, i + MAX_BATCH_SIZE);
            const results = await Promise.all(
                batch.map(async (text) => {
                    const result = await model.embedContent(text);
                    return result.embedding.values;
                })
            );
            embeddings.push(...results);
        }

        return embeddings;
    }

    /**
     * Split text into overlapping chunks for embedding
     */
    static chunkText(
        text: string,
        chunkSize: number = CHUNK_SIZE,
        overlap: number = CHUNK_OVERLAP
    ): { content: string; index: number; metadata: Record<string, unknown> }[] {
        const chunks: { content: string; index: number; metadata: Record<string, unknown> }[] = [];

        if (!text || text.trim().length === 0) {
            return chunks;
        }

        // Try to split on paragraph boundaries first
        const paragraphs = text.split(/\n\s*\n/);
        let currentChunk = '';
        let chunkIndex = 0;
        let charOffset = 0;

        for (const paragraph of paragraphs) {
            const trimmedParagraph = paragraph.trim();
            if (!trimmedParagraph) continue;

            // If adding this paragraph would exceed chunk size, save current chunk
            if (currentChunk.length + trimmedParagraph.length > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.trim(),
                    index: chunkIndex,
                    metadata: {
                        char_start: charOffset - currentChunk.length,
                        char_end: charOffset,
                    },
                });
                chunkIndex++;

                // Keep overlap from the end of the current chunk
                if (overlap > 0 && currentChunk.length > overlap) {
                    currentChunk = currentChunk.slice(-overlap) + '\n\n' + trimmedParagraph;
                } else {
                    currentChunk = trimmedParagraph;
                }
            } else {
                currentChunk = currentChunk
                    ? currentChunk + '\n\n' + trimmedParagraph
                    : trimmedParagraph;
            }

            charOffset += trimmedParagraph.length + 2; // +2 for \n\n
        }

        // Don't forget the last chunk
        if (currentChunk.trim().length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                index: chunkIndex,
                metadata: {
                    char_start: charOffset - currentChunk.length,
                    char_end: charOffset,
                },
            });
        }

        // If text didn't have paragraph breaks, fall back to character-based splitting
        if (chunks.length === 0 && text.trim().length > 0) {
            for (let i = 0; i < text.length; i += chunkSize - overlap) {
                const chunk = text.slice(i, i + chunkSize);
                if (chunk.trim().length > 0) {
                    chunks.push({
                        content: chunk.trim(),
                        index: chunks.length,
                        metadata: {
                            char_start: i,
                            char_end: Math.min(i + chunkSize, text.length),
                        },
                    });
                }
            }
        }

        return chunks;
    }

    /**
     * Estimate token count (rough approximation: ~4 chars per token for English)
     */
    static estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }
}
