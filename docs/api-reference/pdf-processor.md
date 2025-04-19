# PDF Processor

This page documents the PDF processing functionality available in Sonne.

## PDF Service Module

The `src/services/pdf.ts` module provides functions for extracting and processing text from PDF documents.

### `extractText(file: File | Buffer): Promise<string>`

Extracts text content from a PDF file.

**Parameters:**

- `file` (File | Buffer): PDF file as either a browser File object or Node.js Buffer

**Returns:**

- `Promise<string>`: Extracted text content from the PDF

**Example:**

```typescript
import { extractText } from '@/services/pdf';

// In browser context
const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
if (fileInput?.files?.length) {
  const text = await extractText(fileInput.files[0]);
  console.log(text);
}

// In server context
import fs from 'fs/promises';
const buffer = await fs.readFile('path/to/document.pdf');
const text = await extractText(buffer);
console.log(text);
```

### `extractMetadata(file: File | Buffer): Promise<PDFMetadata>`

Extracts metadata from a PDF file.

**Parameters:**

- `file` (File | Buffer): PDF file as either a browser File object or Node.js Buffer

**Returns:**

- `Promise<PDFMetadata>`: Object containing metadata such as:
  - `title`: Document title
  - `author`: Author name
  - `creator`: Creator application
  - `producer`: Producer application
  - `creationDate`: Date when the document was created
  - `modificationDate`: Date when the document was last modified
  - `pageCount`: Number of pages in the document

**Example:**

```typescript
import { extractMetadata } from '@/services/pdf';

async function getDocumentInfo(file: File) {
  const metadata = await extractMetadata(file);
  console.log(`Document title: ${metadata.title}`);
  console.log(`Author: ${metadata.author}`);
  console.log(`Pages: ${metadata.pageCount}`);
}
```

### `processPDF(file: File | Buffer, options?: ProcessOptions): Promise<ProcessedPDF>`

Processes a PDF document and returns both text content and metadata.

**Parameters:**

- `file` (File | Buffer): PDF file as either a browser File object or Node.js Buffer
- `options` (ProcessOptions, optional): Configuration options for processing:
  - `extractImages` (boolean): Whether to extract embedded images
  - `useOCR` (boolean): Whether to apply OCR on image-based content
  - `pageRange` (array): Range of pages to process (e.g., `[1, 10]`)

**Returns:**

- `Promise<ProcessedPDF>`: Object containing:
  - `text`: Extracted text content
  - `metadata`: Document metadata
  - `pages`: List of page-specific content

**Example:**

```typescript
import { processPDF } from '@/services/pdf';

async function analyzePDF(file: File) {
  const options = {
    extractImages: false,
    useOCR: true,
    pageRange: [1, 5]
  };

  const result = await processPDF(file, options);
  console.log(`Document text: ${result.text.substring(0, 100)}...`);  // First 100 chars
  console.log(`Total pages processed: ${result.pages.length}`);
}
```

## Utility Functions

### `validatePDF(file: File): Promise<boolean>`

Validates if a file is a valid PDF.

**Parameters:**

- `file` (File): File to validate

**Returns:**

- `Promise<boolean>`: Whether the file is a valid PDF

**Example:**

```typescript
import { validatePDF } from '@/utils/fileValidation';

async function handleFileUpload(file: File) {
  if (await validatePDF(file)) {
    console.log('Valid PDF file');
    // Process the file
  } else {
    console.error('Invalid PDF file');
    // Show error message
  }
}
```

## Type Definitions

The module uses TypeScript interfaces to define data structures:

```typescript
interface PDFMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
}

interface ProcessOptions {
  extractImages?: boolean;
  useOCR?: boolean;
  pageRange?: [number, number];
}

interface PageContent {
  pageNumber: number;
  text: string;
  images?: string[];  // Base64 encoded images if extractImages is true
}

interface ProcessedPDF {
  text: string;
  metadata: PDFMetadata;
  pages: PageContent[];
}