'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import ErrorMessage from './ErrorMessage';

interface FileUploadProps {
    files: File[];
    onFilesAdded: (files: File[]) => void;
    onFileRemoved: (index: number) => void;
    disabled?: boolean;
    maxFileSizeMb?: number;
}

// Valid file types and their display names
const VALID_FILE_TYPES = {
    'application/pdf': 'PDF',
    'text/markdown': 'Markdown',
    'text/plain': 'Text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

// File type by extension mapping (for cases where MIME type is not reliable)
const FILE_EXTENSIONS: Record<string, string> = {
    'pdf': 'application/pdf',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export default function FileUpload({
    files,
    onFilesAdded,
    onFileRemoved,
    disabled = false,
    maxFileSizeMb = 10, // Default max file size: 10MB
}: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const maxSizeBytes = maxFileSizeMb * 1024 * 1024;

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        setError(null);
        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setError(null);
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);

        // Reset the input so the same file can be selected again if removed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Check if the file is valid based on extension or MIME type
    const isValidFileType = (file: File): boolean => {
        // Get file extension
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop() || '';

        // First check by MIME type
        if (file.type in VALID_FILE_TYPES) {
            return true;
        }

        // Then check by extension if MIME type not recognized
        return fileExtension in FILE_EXTENSIONS;
    };

    // Get the standardized MIME type for a file
    const getStandardizedType = (file: File): string => {
        if (file.type in VALID_FILE_TYPES) {
            return file.type;
        }

        const fileExtension = file.name.toLowerCase().split('.').pop() || '';
        return FILE_EXTENSIONS[fileExtension] || file.type;
    };

    const processFiles = (newFiles: File[]) => {
        // Filter for valid file types
        const validTypeFiles = newFiles.filter(file => {
            const isValid = isValidFileType(file);
            if (!isValid) {
                setError(`Unsupported file type. Please upload PDF (.pdf), Markdown (.md), DOCX (.docx), or text (.txt) files only.`);
                return false;
            }
            return true;
        });

        // Check file size
        const validFiles = validTypeFiles.filter(file => {
            const isValidSize = file.size <= maxSizeBytes;
            if (!isValidSize) {
                setError(`File size must be less than ${maxFileSizeMb}MB`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            // Add standardized type to files to ensure consistent processing
            const filesWithType = validFiles.map(file => {
                const standardizedType = getStandardizedType(file);
                // Create a new File object with the standardized type if needed
                if (file.type !== standardizedType) {
                    return new File([file], file.name, { type: standardizedType });
                }
                return file;
            });

            onFilesAdded(filesWithType);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Get a display name for the file type
    const getFileTypeName = (file: File): string => {
        const standardizedType = getStandardizedType(file);
        return VALID_FILE_TYPES[standardizedType as keyof typeof VALID_FILE_TYPES] || 'File';
    };

    // Get appropriate icon for file type
    const getFileIcon = (file: File) => {
        const standardizedType = getStandardizedType(file);

        switch (standardizedType) {
            case 'application/pdf':
                return (
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
            case 'text/markdown':
                return (
                    <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'text/plain':
                return (
                    <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return (
                    <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
        }
    };

    return (
        <div className="w-full max-w-full space-y-4 sm:space-y-6">
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition-colors ${error ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
                    isDragging
                        ? 'border-gold-500'
                        : disabled
                            ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/30 cursor-not-allowed'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gold-500 dark:hover:border-gold-400'
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.md,.txt,.docx,application/pdf,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    disabled={disabled}
                />
                <svg
                    className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {disabled ? (
                        'Upload in progress...'
                    ) : (
                        <>
                            Drag & drop files or <span className="text-gold-500">browse</span>
                        </>
                    )}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PDF, Markdown, DOCX, or text files up to {maxFileSizeMb}MB
                    <span className="block mt-1">
                        <strong>Note:</strong> Some PDFs with security features, scanned content, or embedded fonts may have extraction issues
                    </span>
                </p>
            </div>

            <ErrorMessage message={error || ''} className="mb-4" />

            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Selected Files</h4>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        {files.map((file, index) => (
                            <li key={index} className="px-3 py-3 sm:px-4 sm:py-3 flex items-center justify-between bg-white dark:bg-[#2C2C2C]">
                                <div className="flex items-center">
                                    {getFileIcon(file)}
                                    <div className="ml-3 max-w-[calc(100%_-_3rem)]">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-xs md:max-w-sm">
                                            {file.name}
                                        </p>
                                        <div className="flex items-center flex-wrap space-x-2">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                                                {getFileTypeName(file)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {!disabled && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFileRemoved(index);
                                        }}
                                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 focus:outline-none ml-2 sm:ml-0"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}