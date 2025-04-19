# Sonne Features

This page provides a comprehensive overview of the features available in Sonne.

## PDF Processing Features

### Text Extraction

Sonne uses PyPDF to extract text content from PDF documents with high accuracy. The text extraction:

- Preserves document structure where possible
- Handles multi-column layouts
- Extracts text from tables and forms
- Works with scanned documents (when text is selectable)

### Metadata Extraction

The application can extract the following metadata from PDF documents:

- Document title
- Author information
- Creation and modification dates
- Page count and dimensions
- Document encryption status

## AI Analysis Features

### Content Summarization

Using Google's Gemini API, Sonne can generate concise summaries of document content, highlighting:

- Key topics and themes
- Main arguments or points
- Important facts and figures

### Named Entity Recognition

Identify and categorize key entities in the document:

- People and organizations
- Locations
- Dates and time expressions
- Monetary values
- Percentages and quantities

### Question Answering

Ask specific questions about document content:

- "What is the main conclusion of this report?"
- "When was the project completed?"
- "How much funding was allocated to Department X?"

## Web Interface Features

- Drag-and-drop document upload
- Interactive analysis results
- Document history and saved analyses
- Export results in multiple formats (JSON, CSV, PDF)

## API Features

Sonne provides a RESTful API for integration with other systems:

- Document upload endpoint
- Analysis request endpoints
- Results retrieval endpoints
- Batch processing capabilities