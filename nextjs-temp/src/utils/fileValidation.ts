import { FILE_CONSTRAINTS, ERROR_MESSAGES } from '@/constants/api';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateFile(file: File): ValidationResult {
    // Check file size
    if (file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: ERROR_MESSAGES.FILE_TOO_LARGE,
        };
    }

    // Check file type - now supporting both PDFs and images
    const acceptedTypes = Object.keys(FILE_CONSTRAINTS.ACCEPTED_FILE_TYPES);
    if (!acceptedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Only PDF and image files (JPEG, PNG, TIFF, BMP, GIF) are accepted',
        };
    }

    return { isValid: true };
}

export function validateFiles(files: File[]): ValidationResult {
    for (const file of files) {
        const result = validateFile(file);
        if (!result.isValid) {
            return result;
        }
    }

    return { isValid: true };
}