'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import ErrorMessage from './ErrorMessage';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface DocumentUploaderProps {
    onUploadComplete: () => void;
    disabled?: boolean;
    maxFileSizeMb?: number;
}

const VALID_FILE_TYPES: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/markdown': 'Markdown',
    'text/plain': 'Text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

const FILE_EXTENSIONS: Record<string, string> = {
    pdf: 'application/pdf',
    md: 'text/markdown',
    txt: 'text/plain',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export default function DocumentUploader({
    onUploadComplete,
    disabled = false,
    maxFileSizeMb = 10,
}: DocumentUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ filename: string; status: 'pending' | 'uploading' | 'done' | 'error' }[]>([]);

    const maxSizeBytes = maxFileSizeMb * 1024 * 1024;

    const isValidFileType = (file: File): boolean => {
        if (file.type in VALID_FILE_TYPES) return true;
        const ext = file.name.toLowerCase().split('.').pop() || '';
        return ext in FILE_EXTENSIONS;
    };

    const getStandardizedType = (file: File): string => {
        if (file.type in VALID_FILE_TYPES) return file.type;
        const ext = file.name.toLowerCase().split('.').pop() || '';
        return FILE_EXTENSIONS[ext] || file.type;
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) setIsDragging(true);
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
        if (disabled || isUploading) return;
        const droppedFiles = Array.from(e.dataTransfer.files);
        processAndUpload(droppedFiles);
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const selectedFiles = Array.from(e.target.files);
        processAndUpload(selectedFiles);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processAndUpload = async (files: File[]) => {
        setError(null);

        // Validate files
        const validFiles: File[] = [];
        for (const file of files) {
            if (!isValidFileType(file)) {
                setError('Unsupported file type. Supported: PDF, DOCX, Markdown, Text');
                continue;
            }
            if (file.size > maxSizeBytes) {
                setError(`File size must be less than ${maxFileSizeMb}MB`);
                continue;
            }
            // Standardize the type
            const standardizedType = getStandardizedType(file);
            if (file.type !== standardizedType) {
                validFiles.push(new File([file], file.name, { type: standardizedType }));
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) return;

        // Upload to RAG ingest
        setIsUploading(true);
        setUploadProgress(validFiles.map((f) => ({ filename: f.name, status: 'pending' })));

        try {
            setUploadProgress(validFiles.map((f) => ({ filename: f.name, status: 'uploading' })));

            const formData = new FormData();
            validFiles.forEach((file) => formData.append('files', file));

            const res = await fetch('/api/rag/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Upload failed');
            }

            const data = await res.json();

            // Check for individual file errors
            const results = data.documents || [];
            const newProgress = validFiles.map((f, i) => ({
                filename: f.name,
                status: (results[i]?.error ? 'error' : 'done') as 'done' | 'error',
            }));
            setUploadProgress(newProgress);

            const hasErrors = results.some((r: { error?: string }) => r.error);
            if (hasErrors) {
                const errorFiles = results
                    .filter((r: { error?: string }) => r.error)
                    .map((r: { filename: string; error: string }) => `${r.filename}: ${r.error}`)
                    .join(', ');
                setError(`Some files had issues: ${errorFiles}`);
            }

            // Notify parent to refresh document list
            onUploadComplete();

            // Clear progress after a delay
            setTimeout(() => {
                setUploadProgress([]);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setUploadProgress(validFiles.map((f) => ({ filename: f.name, status: 'error' })));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${error
                        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                        : isDragging
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : isUploading
                                ? 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/30 cursor-wait'
                                : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-light'
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.md,.txt,.docx,application/pdf,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    disabled={disabled || isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <ArrowPathIcon className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Uploading & indexing documents...
                        </p>
                    </div>
                ) : (
                    <>
                        <svg
                            className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Drop files to add to library or{' '}
                            <span className="text-primary">browse</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            PDF, DOCX, Markdown, or Text files up to {maxFileSizeMb}MB
                        </p>
                    </>
                )}
            </div>

            {/* Upload progress */}
            {uploadProgress.length > 0 && (
                <div className="space-y-1">
                    {uploadProgress.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-gray-50 dark:bg-gray-800"
                        >
                            {item.status === 'uploading' && (
                                <ArrowPathIcon className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
                            )}
                            {item.status === 'done' && (
                                <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {item.status === 'error' && (
                                <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {item.status === 'pending' && (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                            )}
                            <span className="text-gray-600 dark:text-gray-400 truncate">{item.filename}</span>
                        </div>
                    ))}
                </div>
            )}

            <ErrorMessage message={error || ''} />
        </div>
    );
}
