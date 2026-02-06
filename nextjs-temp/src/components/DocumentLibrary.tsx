'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { TrashIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';

export interface RAGDocument {
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    page_count: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

interface DocumentLibraryProps {
    documents: RAGDocument[];
    selectedDocIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onDocumentsChanged: () => void;
    isLoading?: boolean;
}

export default function DocumentLibrary({
    documents,
    selectedDocIds,
    onSelectionChange,
    onDocumentsChanged,
    isLoading = false,
}: DocumentLibraryProps) {
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        docId: string | null;
        docName: string | null;
    }>({ isOpen: false, docId: null, docName: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelection = (docId: string) => {
        if (selectedDocIds.includes(docId)) {
            onSelectionChange(selectedDocIds.filter((id) => id !== docId));
        } else {
            onSelectionChange([...selectedDocIds, docId]);
        }
    };

    const selectAll = () => {
        if (selectedDocIds.length === documents.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(documents.map((d) => d.id));
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmation.docId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/rag/documents/${deleteConfirmation.docId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Document removed from library');
            // Remove from selection if it was selected
            onSelectionChange(selectedDocIds.filter((id) => id !== deleteConfirmation.docId));
            onDocumentsChanged();
        } catch {
            toast.error('Failed to delete document');
        } finally {
            setIsDeleting(false);
            setDeleteConfirmation({ isOpen: false, docId: null, docName: null });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf':
                return <span className="text-red-500 text-xs font-bold">PDF</span>;
            case 'docx':
                return <span className="text-indigo-500 text-xs font-bold">DOCX</span>;
            case 'markdown':
                return <span className="text-blue-500 text-xs font-bold">MD</span>;
            case 'text':
                return <span className="text-gray-500 text-xs font-bold">TXT</span>;
            default:
                return <span className="text-gray-400 text-xs font-bold">FILE</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-6 w-6 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading documents...</span>
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-8 px-4">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    No documents in your library yet.
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Upload documents above to start asking questions.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Your Documents ({documents.length})
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={selectAll}
                        className="text-xs text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors"
                    >
                        {selectedDocIds.length === documents.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                        onClick={onDocumentsChanged}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="h-4 w-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {selectedDocIds.length > 0 && (
                <p className="text-xs text-primary dark:text-primary-light">
                    {selectedDocIds.length} document{selectedDocIds.length > 1 ? 's' : ''} selected — questions will search these documents
                </p>
            )}

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {documents.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                        <div
                            key={doc.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-150 group ${isSelected
                                    ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 dark:border-primary/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/20 bg-white dark:bg-[#2C2C2C]'
                                }`}
                            onClick={() => toggleSelection(doc.id)}
                        >
                            {/* Checkbox */}
                            <div
                                className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                        ? 'bg-primary border-primary'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            {/* File icon */}
                            <div className="flex-shrink-0 w-9 h-9 rounded-md bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                {getFileIcon(doc.file_type)}
                            </div>

                            {/* File info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {doc.filename}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatFileSize(doc.file_size)}
                                    {doc.page_count ? ` • ${doc.page_count} pages` : ''}
                                    {' • '}
                                    {formatDate(doc.created_at)}
                                </p>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmation({
                                        isOpen: true,
                                        docId: doc.id,
                                        docName: doc.filename,
                                    });
                                }}
                                className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove document"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                title="Remove Document"
                message={`Remove "${deleteConfirmation.docName}" from your library? This will also remove it from all conversations.`}
                confirmText={isDeleting ? 'Removing...' : 'Remove'}
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmation({ isOpen: false, docId: null, docName: null })}
                isDestructive
            />
        </div>
    );
}
