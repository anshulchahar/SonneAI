export const API_ENDPOINTS = {
    ANALYZE: '/api/analyze',
    HISTORY: '/api/history',
    ANALYSIS_DETAILS: (id: string) => `/api/analysis/${id}`,
} as const;

export const FILE_CONSTRAINTS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_FILE_TYPES: {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/tiff': ['.tif', '.tiff'],
        'image/bmp': ['.bmp'],
        'image/gif': ['.gif'],
    },
} as const;

export const ANALYSIS_SECTIONS = {
    SUMMARY: 'Executive Summary',
    KEY_POINTS: 'Key Points',
    DETAILED_ANALYSIS: 'Detailed Analysis',
    RECOMMENDATIONS: 'Recommendations',
    DOCUMENT_COMPARISON: 'Document Comparison',
} as const;

export const EXPORT_FORMATS = {
    PDF: {
        extension: 'pdf',
        mimeType: 'application/pdf',
    },
    MARKDOWN: {
        extension: 'md',
        mimeType: 'text/markdown',
    },
    TEXT: {
        extension: 'txt',
        mimeType: 'text/plain',
    },
} as const;

export const ERROR_MESSAGES = {
    FILE_TOO_LARGE: 'File size exceeds 10MB limit',
    INVALID_FILE_TYPE: 'Only PDF and image files (JPEG, PNG, TIFF, BMP, GIF) are accepted',
    UNAUTHORIZED: 'Please sign in to continue',
    ANALYSIS_FAILED: 'Failed to analyze document',
    FETCH_FAILED: 'Failed to fetch data',
} as const;