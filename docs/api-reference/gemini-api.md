# Gemini API Integration

This page documents the Google Gemini API integration in Sonne.

## Gemini Service Module

The `src/services/gemini.ts` module provides functions for interacting with Google's Gemini API to analyze document content.

### `analyzeText(text: string, options?: AnalysisOptions): Promise<AnalysisResult>`

Analyzes text content using the Gemini API.

**Parameters:**

- `text` (string): Text content to analyze
- `options` (AnalysisOptions, optional): Configuration options including:
  - `mode`: Analysis mode (default: "general")
  - `maxLength`: Maximum response length
  - `temperature`: Model temperature setting

**Returns:**

- `Promise<AnalysisResult>`: Analysis results with structure defined by the AnalysisResult type

**Example:**

```typescript
import { analyzeText } from '@/services/gemini';

async function performAnalysis() {
  const text = "Your document text here...";
  const analysis = await analyzeText(text, { mode: "summary" });
  console.log(`Summary: ${analysis.summary}`);
}
```

### `askQuestion(context: string, question: string): Promise<string>`

Asks a specific question about the document content.

**Parameters:**

- `context` (string): Document text content
- `question` (string): Question to ask about the document

**Returns:**

- `Promise<string>`: Answer to the question

**Example:**

```typescript
import { askQuestion } from '@/services/gemini';

async function questionDocument() {
  const text = "Your document text here...";
  const question = "What is the main topic of this document?";
  const answer = await askQuestion(text, question);
  console.log(`Q: ${question}`);
  console.log(`A: ${answer}`);
}
```

### `analyzeWithPrompt(text: string, prompt: string): Promise<string>`

Analyzes text using a custom prompt template.

**Parameters:**

- `text` (string): Document text content
- `prompt` (string): Custom prompt template to use for analysis

**Returns:**

- `Promise<string>`: Generated response from the model

**Example:**

```typescript
import { analyzeWithPrompt } from '@/services/gemini';
import { EXTRACT_KEY_POINTS } from '@/config/prompts';

async function extractKeyPoints() {
  const text = "Your document text here...";
  const keyPoints = await analyzeWithPrompt(text, EXTRACT_KEY_POINTS);
  console.log(keyPoints);
}
```

## Type Definitions

The module uses TypeScript interfaces to define data structures:

```typescript
interface AnalysisOptions {
  mode?: "general" | "summary" | "entities" | "sentiment";
  maxLength?: number;
  temperature?: number;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  entities?: {
    name: string;
    type: string;
  }[];
  sentiment?: {
    score: number;
    label: "positive" | "negative" | "neutral";
  };
  metadata?: Record<string, any>;
}
```

## Configuration

The Gemini API integration requires an API key to be configured. This is managed through environment variables:

1. In a `.env.local` file in the project root directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. Or through Next.js environment configuration:
   ```typescript
   // In next.config.mjs
   const nextConfig = {
     env: {
       GEMINI_API_KEY: process.env.GEMINI_API_KEY,
     },
     // Other configuration...
   };
   ```