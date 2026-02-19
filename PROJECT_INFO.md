# SonneAI

## Tagline
<!-- One-liner, max 15 words -->
AI-powered document analysis platform with RAG chat for intelligent PDF understanding.

## Description
<!-- 2-3 sentences: what it is, who it's for, what problem it solves -->
SonneAI is a full-stack web application that lets users upload PDF documents and receive AI-generated summaries, key-point extraction, and actionable recommendations powered by Google's Gemini models. It features a Retrieval-Augmented Generation (RAG) chat interface that enables natural-language Q&A grounded in uploaded documents using vector similarity search. Built for researchers, students, and professionals who need to quickly extract insights from dense documents without reading them end to end.

## My Role
<!-- e.g., Full Stack Developer, ML Researcher -->
Solo Full Stack Developer & AI/ML Engineer

## Duration
<!-- e.g., "Oct 2024 – Mar 2025" or "Ongoing" -->
Jan 2025 – Ongoing

## Organization
<!-- e.g., "Personal Project", "TU Darmstadt" -->
Personal Project (Open Source)

## Tech Stack
- **Frontend**: React 18, Next.js 15 (App Router, Turbopack), Tailwind CSS, Framer Motion, Headless UI, Heroicons
- **Backend**: Next.js API Routes (Node.js), NextAuth.js (Google OAuth)
- **Database**: Supabase (PostgreSQL), pgvector extension, Row Level Security
- **AI/ML**: Google Gemini API (gemini-3-flash, 2.0-flash, 1.5-pro), Gemini Embedding API (gemini-embedding-001, 768-dim vectors), RAG pipeline with hybrid search (semantic + keyword via ts_rank)
- **DevOps/Infra**: GitHub Actions CI/CD (lint → test → build), Jest + Codecov, Dependabot, MkDocs Material (auto-deployed docs site), Vercel Analytics & Speed Insights
- **Other**: pdf-parse (text extraction), react-dropzone (file uploads), jsPDF / docx / file-saver (multi-format export), EmailJS (contact form), pre-commit hooks

## Key Features
<!-- 3-6 major features, each 1-2 sentences -->
1. **AI Document Analysis**: Upload one or multiple PDFs and receive structured AI analysis — including summary, key points, detailed analysis, and actionable recommendations — using Gemini with configurable output length and custom prompts.
2. **RAG Chat Interface**: Ask natural-language questions about uploaded documents with source-cited answers. Uses a full retrieval pipeline: document chunking → embedding → HNSW vector index → hybrid semantic + keyword search → grounded LLM response.
3. **Multi-Format Export**: Download analysis results in PDF, DOCX, Markdown, or plain text with professional formatting, timestamps, and structured sections.
4. **Document Library & History**: Persistent document management with conversation history, allowing users to revisit past analyses and continue RAG conversations across sessions.
5. **Usage Limits & Freemium Model**: Built-in usage tracking (4 analyses, 3 conversations per free user) with real-time usage banners, designed for future tier expansion.
6. **Dark Mode & Responsive UI**: Full dark/light theme support with smooth Framer Motion transitions, ChatGPT-style sidebar navigation, and mobile-responsive layout.

## Architecture Overview
<!-- 2-4 sentences on high-level system design and how components interact -->
The application follows a Next.js App Router architecture with server-side API routes handling all AI and database operations. The frontend communicates with backend API routes (`/api/analyze`, `/api/rag/*`, `/api/history`) that orchestrate three core services: `GeminiService` (multi-model fallback for text generation), `EmbeddingService` (document chunking and 768-dim vector embedding with MRL truncation), and `RAGService` (document ingestion, vector similarity search via Supabase RPC functions, and context-grounded answer generation). Supabase PostgreSQL with pgvector stores all user data, document chunks with HNSW-indexed embeddings, conversations, and messages — with custom SQL functions (`match_document_chunks`, `hybrid_search`, `get_rag_context`) performing server-side vector operations. Authentication flows through NextAuth.js with Google OAuth, and the CI/CD pipeline runs ESLint, TypeScript checks, Jest tests with code coverage, and automated build verification via GitHub Actions.

## Challenges & Solutions

### Challenge 1: Building a Production-Ready RAG Pipeline
**Problem**: Implementing retrieval-augmented generation that returns accurate, source-cited answers from potentially large documents required solving chunking strategy, embedding quality, search relevance, and prompt engineering simultaneously.
**Solution**: Designed a multi-stage pipeline: paragraph-aware text chunking (1000 chars, 200-char overlap) preserving document structure, batch embedding via Gemini's embedding-001 model with MRL truncation to 768 dimensions, HNSW index for sub-linear similarity search, and a hybrid scoring function (70% semantic / 30% keyword via PostgreSQL `ts_rank_cd`) implemented as Supabase RPC functions. The RAG prompt template includes source citations and conversation context for multi-turn dialogue.

### Challenge 2: Gemini API Resilience & Model Fallback
**Problem**: Google's Gemini API underwent frequent model deprecations and version changes, causing production outages when a single model endpoint was hardcoded.
**Solution**: Implemented a multi-layer fallback system in `GeminiService` that automatically tries multiple API versions (`v1`, `v1beta`, etc.) and model variations (`gemini-3-flash-preview` → `gemini-2.0-flash` → `gemini-1.5-pro` → `gemini-1.5-flash`) before failing, ensuring the application degrades gracefully through model transitions.

### Challenge 3: Structured AI Output Parsing
**Problem**: Gemini's free-form text responses needed to be reliably parsed into structured analysis data (summary, key points, detailed analysis, recommendations) for consistent UI rendering and multi-format export.
**Solution**: Built a robust response parser (~290 lines) using regex-based section detection with multiple format variations, paragraph/sentence-level splitting with intelligent grouping, and fallback extraction logic that handles inconsistent formatting, missing sections, and edge cases in LLM output.

## Impact & Metrics
<!-- Quantifiable results, real numbers or reasonable estimates -->
- Processes documents and generates structured analyses in ~5–15 seconds per document depending on length
- RAG pipeline chunks and embeds documents at ~100 chunks/batch with HNSW index enabling sub-100ms vector lookups
- Hybrid search achieves higher relevance than pure semantic search by combining 70% vector similarity with 30% keyword ranking
- Supports multi-file upload and analysis in a single request
- 23 reusable React components, 3 core services, 7 API routes, and ~4,000+ lines of TypeScript
- Complete CI/CD pipeline with automated linting, type checking, unit tests, and code coverage reporting

## Screenshots / Demo
- **Live Demo**: [sonneai.com](https://sonneai.com)
- **GitHub**: [github.com/anshulchahar/SonneAI](https://github.com/anshulchahar/SonneAI)
- **Video/Screenshots**: _To be added_

## What I Learned
<!-- 2-3 key technical or professional takeaways -->
1. **RAG System Design**: Gained deep hands-on experience with the full RAG stack — from text chunking strategies and embedding model selection to HNSW indexing, hybrid search scoring, and prompt engineering for grounded responses — understanding the tradeoffs between chunk size, overlap, and retrieval precision.
2. **Production AI Resilience**: Learned the importance of building fault-tolerant AI integrations — implementing multi-model fallbacks, robust output parsing, and usage limits — to handle the inherent unpredictability of LLM APIs and outputs in production.
3. **Full-Stack TypeScript at Scale**: Developed proficiency in building a complete, type-safe application from database schema (Supabase + pgvector) to API layer (Next.js API routes) to interactive UI (React + Framer Motion), with CI/CD, testing, and documentation all integrated into a single developer workflow.

## Status
<!-- "Completed", "In Production", "Ongoing", or "Archived" -->
In Production
