import { supabaseAdmin } from '@/lib/supabase';
import { EmbeddingService } from '@/services/embedding';
import { GeminiService } from '@/services/gemini';
import { v4 as uuidv4 } from 'uuid';

export interface RAGSearchResult {
    chunk_id: string;
    document_id: string;
    filename: string;
    chunk_content: string;
    chunk_index: number;
    similarity: number;
    document_metadata: Record<string, unknown>;
    chunk_metadata: Record<string, unknown>;
}

export interface RAGResponse {
    answer: string;
    sources: RAGSearchResult[];
    conversation_id: string;
    message_id: string;
}

export interface DocumentIngestionResult {
    document_id: string;
    filename: string;
    chunk_count: number;
    total_tokens: number;
}

export class RAGService {
    private embeddingService: EmbeddingService;

    constructor() {
        this.embeddingService = new EmbeddingService();
    }

    /**
     * Ingest a document: store it, chunk it, embed the chunks, and save to Supabase
     */
    async ingestDocument(
        userId: string,
        filename: string,
        content: string,
        fileType: string,
        fileSize?: number,
        pageCount?: number,
        metadata?: Record<string, unknown>
    ): Promise<DocumentIngestionResult> {
        // 1. Store the document record
        const documentId = uuidv4();
        const { error: docError } = await supabaseAdmin
            .from('documents')
            .insert({
                id: documentId,
                userId,
                filename,
                file_type: fileType,
                file_size: fileSize || null,
                page_count: pageCount || null,
                content,
                metadata: metadata || {},
            });

        if (docError) {
            console.error('Error storing document:', docError);
            throw new Error(`Failed to store document: ${docError.message}`);
        }

        // 2. Chunk the text
        const chunks = EmbeddingService.chunkText(content);

        if (chunks.length === 0) {
            console.warn(`No chunks generated for document ${filename} (content length: ${content.length}). Removing orphaned document record.`);
            await supabaseAdmin.from('documents').delete().eq('id', documentId);
            throw new Error(`No text chunks could be generated from "${filename}". The document may be empty or contain only whitespace.`);
        }

        // 3. Generate embeddings for all chunks
        console.log(`Generating embeddings for ${chunks.length} chunks of ${filename}...`);
        const chunkTexts = chunks.map((c) => c.content);
        let embeddings: number[][];
        try {
            embeddings = await this.embeddingService.generateEmbeddings(chunkTexts);
            console.log(`Embeddings generated: ${embeddings.length} vectors, ${embeddings[0]?.length} dimensions each`);
        } catch (embeddingError) {
            console.error(`Embedding generation failed for ${filename}:`, embeddingError);
            // Clean up the orphaned document record
            await supabaseAdmin.from('documents').delete().eq('id', documentId);
            throw new Error(`Failed to generate embeddings for "${filename}": ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`);
        }

        // 4. Store chunks with embeddings
        let totalTokens = 0;
        const chunkRecords = chunks.map((chunk, i) => {
            const tokenCount = EmbeddingService.estimateTokenCount(chunk.content);
            totalTokens += tokenCount;
            return {
                id: uuidv4(),
                document_id: documentId,
                userId,
                chunk_index: chunk.index,
                content: chunk.content,
                token_count: tokenCount,
                embedding: JSON.stringify(embeddings[i]),
                metadata: chunk.metadata,
            };
        });

        // Insert in batches of 50 to avoid payload size limits
        const BATCH_SIZE = 50;
        for (let i = 0; i < chunkRecords.length; i += BATCH_SIZE) {
            const batch = chunkRecords.slice(i, i + BATCH_SIZE);
            const { error: chunkError } = await supabaseAdmin
                .from('document_chunks')
                .insert(batch);

            if (chunkError) {
                console.error(`Error storing chunk batch ${i / BATCH_SIZE} for ${filename}:`, chunkError);
                // Clean up: remove any chunks already inserted and the document record
                await supabaseAdmin.from('document_chunks').delete().eq('document_id', documentId);
                await supabaseAdmin.from('documents').delete().eq('id', documentId);
                throw new Error(`Failed to store document chunks: ${chunkError.message}`);
            }
        }

        console.log(
            `Document "${filename}" ingested: ${chunks.length} chunks, ~${totalTokens} tokens`
        );

        return {
            document_id: documentId,
            filename,
            chunk_count: chunks.length,
            total_tokens: totalTokens,
        };
    }

    /**
     * Search for relevant document chunks using vector similarity
     */
    async searchDocuments(
        query: string,
        userId: string,
        documentIds?: string[],
        matchCount: number = 8,
        similarityThreshold: number = 0.4
    ): Promise<RAGSearchResult[]> {
        // Generate embedding for the query
        const queryEmbedding = await this.embeddingService.generateEmbedding(query);

        // Call the Supabase RPC function for vector similarity search
        const { data, error } = await supabaseAdmin.rpc('get_rag_context', {
            query_embedding: JSON.stringify(queryEmbedding),
            p_user_id: userId,
            p_document_ids: documentIds || null,
            p_match_count: matchCount,
            p_similarity_threshold: similarityThreshold,
        });

        if (error) {
            console.error('Error searching documents:', error);
            throw new Error(`Vector search failed: ${error.message}`);
        }

        return (data || []) as RAGSearchResult[];
    }

    /**
     * Perform RAG: search for context, then generate an answer using Gemini
     */
    async query(
        question: string,
        userId: string,
        conversationId?: string,
        documentIds?: string[],
        matchCount: number = 8
    ): Promise<RAGResponse> {
        // 1. Retrieve relevant chunks
        const relevantChunks = await this.searchDocuments(
            question,
            userId,
            documentIds,
            matchCount
        );

        // 2. Build context from retrieved chunks
        const context = relevantChunks
            .map(
                (chunk, i) =>
                    `[Source ${i + 1}: ${chunk.filename} (chunk ${chunk.chunk_index + 1}, relevance: ${(chunk.similarity * 100).toFixed(1)}%)]\n${chunk.chunk_content}`
            )
            .join('\n\n---\n\n');

        // 3. Build the RAG prompt
        const ragPrompt = this.buildRAGPrompt(question, context, relevantChunks.length > 0);

        // 4. Generate response using Gemini
        const geminiService = new GeminiService();
        const answer = await geminiService.analyzeDocuments([ragPrompt]);

        // 5. Create or update conversation
        let convId: string = conversationId || '';
        if (!convId) {
            const { data: conv, error: convError } = await supabaseAdmin
                .from('conversations')
                .insert({
                    id: uuidv4(),
                    userId,
                    title: question.slice(0, 100),
                    document_ids: documentIds || [],
                })
                .select('id')
                .single();

            if (convError) {
                console.error('Error creating conversation:', convError);
                throw new Error(`Failed to create conversation: ${convError.message}`);
            }
            convId = conv.id;
        }

        // 6. Store user message
        await supabaseAdmin.from('messages').insert({
            id: uuidv4(),
            conversation_id: convId,
            userId,
            role: 'user',
            content: question,
            token_count: EmbeddingService.estimateTokenCount(question),
        });

        // 7. Store assistant message with sources
        const messageId = uuidv4();
        const sources = relevantChunks.map((chunk) => ({
            document_id: chunk.document_id,
            chunk_id: chunk.chunk_id,
            filename: chunk.filename,
            snippet: chunk.chunk_content.slice(0, 200),
            similarity: chunk.similarity,
        }));

        await supabaseAdmin.from('messages').insert({
            id: messageId,
            conversation_id: convId,
            userId,
            role: 'assistant',
            content: answer,
            sources,
            token_count: EmbeddingService.estimateTokenCount(answer),
        });

        // 8. Update conversation timestamp
        await supabaseAdmin
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);

        return {
            answer,
            sources: relevantChunks,
            conversation_id: convId,
            message_id: messageId,
        };
    }

    /**
     * Build a RAG prompt with retrieved context
     */
    private buildRAGPrompt(question: string, context: string, hasContext: boolean): string {
        if (!hasContext) {
            return `The user asked a question but no relevant documents were found in their uploaded documents.

Question: ${question}

Please respond by letting the user know that you couldn't find relevant information in their uploaded documents to answer this question. Suggest they upload relevant documents first, or rephrase their question.`;
        }

        return `You are a helpful document analysis assistant. Answer the user's question based ONLY on the provided document context below. If the context doesn't contain enough information to fully answer the question, say so clearly.

When citing information, reference the source document by name.

## Retrieved Document Context

${context}

## User Question

${question}

## Instructions
- Answer based ONLY on the information found in the document context above
- If multiple documents are relevant, synthesize information across them
- Cite which document(s) your answer comes from using [Source N] references
- If the context doesn't contain the answer, clearly state that
- Be concise but thorough
- Use markdown formatting for readability`;
    }

    /**
     * Get all documents for a user
     */
    async getUserDocuments(userId: string) {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('id, filename, file_type, file_size, page_count, metadata, created_at')
            .eq('userId', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }
        return data || [];
    }

    /**
     * Get conversations for a user
     */
    async getUserConversations(userId: string) {
        const { data, error } = await supabaseAdmin
            .from('conversations')
            .select('id, title, document_ids, created_at, updated_at')
            .eq('userId', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch conversations: ${error.message}`);
        }
        return data || [];
    }

    /**
     * Get messages for a conversation
     */
    async getConversationMessages(conversationId: string, userId: string) {
        const { data, error } = await supabaseAdmin
            .from('messages')
            .select('id, role, content, sources, created_at')
            .eq('conversation_id', conversationId)
            .eq('userId', userId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch messages: ${error.message}`);
        }
        return data || [];
    }

    /**
     * Delete a document and all associated data
     */
    async deleteDocument(documentId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin.rpc('delete_document_with_chunks', {
            p_document_id: documentId,
            p_user_id: userId,
        });

        if (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
        return data as boolean;
    }
}
