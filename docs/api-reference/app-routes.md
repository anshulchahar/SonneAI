# Application Routes Reference

This page documents the Next.js application routes and API endpoints available in Sonne.

## Web Interface Routes

### `GET /`

The main application route that renders the home page with document upload functionality.

**Response:** Next.js rendered page with document upload form.

### `GET /auth/signin`

Authentication page for user sign-in.

**Response:** Next.js rendered sign-in page.

### `GET /history`

View history of previously analyzed documents.

**Response:** Next.js rendered page displaying document analysis history.

### `GET /analysis/[id]`

View detailed results for a specific document analysis.

**URL Parameters:**
- `id`: Unique identifier for the analysis

**Response:** Next.js rendered page showing detailed analysis results.

## API Endpoints

### `POST /api/simple-upload`

Endpoint for uploading PDF documents.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with file containing the PDF document

**Response:**
```json
{
  "success": true,
  "fileId": "unique-file-identifier",
  "message": "File uploaded successfully"
}
```

### `POST /api/analyze-complete/route`

Endpoint for analyzing a previously uploaded document.

**Request:**
- Content-Type: `application/json`
- Body:
```json
{
  "fileId": "unique-file-identifier",
  "options": {
    "extractImages": false,
    "includeMetadata": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "unique-analysis-id",
  "status": "completed",
  "results": {
    "summary": "Document summary...",
    "keyPoints": ["Point 1", "Point 2"],
    "metadata": {
      "title": "Document Title",
      "author": "Author Name",
      "pageCount": 10
    }
  }
}
```

### `GET /api/analysis/[id]/route`

Endpoint for retrieving a specific analysis.

**URL Parameters:**
- `id`: Unique identifier for the analysis

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "unique-analysis-id",
    "fileId": "unique-file-identifier",
    "timestamp": "2025-04-01T15:30:45",
    "results": {
      "summary": "Document summary...",
      "keyPoints": ["Point 1", "Point 2"]
    },
    "status": "completed"
  }
}
```

### `GET /api/history/route`

Endpoint for retrieving a list of previous document analyses.

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "id": "unique-analysis-id-1",
      "filename": "document1.pdf",
      "timestamp": "2025-04-01T12:34:56",
      "status": "completed"
    },
    {
      "id": "unique-analysis-id-2",
      "filename": "document2.pdf",
      "timestamp": "2025-04-02T10:11:12",
      "status": "processing"
    }
  ]
}
```

## Authentication

The application uses NextAuth.js for authentication. API endpoints are protected using middleware that verifies authentication status.

### `GET/POST /api/auth/[...nextauth]/route`

NextAuth.js authentication endpoints.

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `415 Unsupported Media Type`: Unsupported file format
- `500 Internal Server Error`: Server-side error

Error responses include a JSON object with error details:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```