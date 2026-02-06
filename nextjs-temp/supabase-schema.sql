-- =============================================================================
-- Sonne AI - Complete Supabase Schema with RAG (pgvector)
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =============================================================================
-- Auth Tables (NextAuth)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier TEXT,
  token TEXT,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- =============================================================================
-- Analysis Table (legacy document analysis results)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.analysis (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  "fileContent" TEXT,
  summary TEXT,
  "keyPoints" TEXT,
  analysis TEXT,
  recommendations TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- RAG Tables
-- =============================================================================

-- Documents: stores uploaded documents and metadata
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  page_count INTEGER,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks with 768-dim vector embeddings (Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding extensions.vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations: groups RAG chat messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  document_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages: individual chat messages with source citations
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  token_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts("userId");
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions("userId");
CREATE INDEX IF NOT EXISTS analysis_user_id_idx ON public.analysis("userId");
CREATE INDEX IF NOT EXISTS analysis_created_at_idx ON public.analysis("createdAt" DESC);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents("userId");
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS documents_metadata_idx ON public.documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS chunks_user_id_idx ON public.document_chunks("userId");
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON public.conversations("userId");
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON public.document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- Functions
-- =============================================================================

-- Vector similarity search
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding extensions.vector(768),
  match_count INTEGER DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_document_ids UUID[] DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID, document_id UUID, chunk_index INTEGER,
  content TEXT, metadata JSONB, similarity FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.document_id, dc.chunk_index, dc.content, dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE (filter_user_id IS NULL OR dc."userId" = filter_user_id)
    AND (filter_document_ids IS NULL OR dc.document_id = ANY(filter_document_ids))
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Hybrid search (vector + keyword)
CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_text TEXT, query_embedding extensions.vector(768),
  match_count INTEGER DEFAULT 5, filter_user_id UUID DEFAULT NULL,
  filter_document_ids UUID[] DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.3,
  keyword_weight FLOAT DEFAULT 0.3, semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID, document_id UUID, chunk_index INTEGER,
  content TEXT, metadata JSONB, similarity FLOAT, combined_score FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.document_id, dc.chunk_index, dc.content, dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    (semantic_weight * (1 - (dc.embedding <=> query_embedding)) +
     keyword_weight * ts_rank_cd(to_tsvector('english', dc.content),
       plainto_tsquery('english', query_text))) AS combined_score
  FROM public.document_chunks dc
  WHERE (filter_user_id IS NULL OR dc."userId" = filter_user_id)
    AND (filter_document_ids IS NULL OR dc.document_id = ANY(filter_document_ids))
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- RAG context retrieval (joins chunks with document info)
CREATE OR REPLACE FUNCTION public.get_rag_context(
  query_embedding extensions.vector(768), p_user_id UUID,
  p_document_ids UUID[] DEFAULT NULL, p_match_count INTEGER DEFAULT 8,
  p_similarity_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  chunk_id UUID, document_id UUID, filename TEXT, chunk_content TEXT,
  chunk_index INTEGER, similarity FLOAT,
  document_metadata JSONB, chunk_metadata JSONB
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.document_id, d.filename, dc.content, dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.metadata AS document_metadata, dc.metadata AS chunk_metadata
  FROM public.document_chunks dc
  INNER JOIN public.documents d ON d.id = dc.document_id
  WHERE dc."userId" = p_user_id
    AND (p_document_ids IS NULL OR dc.document_id = ANY(p_document_ids))
    AND 1 - (dc.embedding <=> query_embedding) > p_similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT p_match_count;
END;
$$;
