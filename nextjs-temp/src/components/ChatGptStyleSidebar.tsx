'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { AnalysisHistory } from '@/types/api';
import { formatDate } from '@/utils/formatters';
import { useSidebar } from '@/contexts/SidebarContext';
import { TrashIcon, DocumentTextIcon, ChevronLeftIcon, BookOpenIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';

interface ChatGptStyleSidebarProps {
    history: AnalysisHistory[];
    isOpen: boolean;
    onClose: () => void;
    onHistoryUpdated?: () => void;
}

export default function ChatGptStyleSidebar({
    history,
    isOpen,
    onClose,
    onHistoryUpdated
}: ChatGptStyleSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { toggle } = useSidebar();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        itemId: string | null;
        itemName: string | null;
    }>({
        isOpen: false,
        itemId: null,
        itemName: null
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [ingestingIds, setIngestingIds] = useState<Set<string>>(new Set());

    const handleChatClick = async (e: React.MouseEvent, item: AnalysisHistory) => {
        e.preventDefault();
        e.stopPropagation();

        if (ingestingIds.has(item.id)) return;

        setIngestingIds(prev => new Set(prev).add(item.id));

        try {
            // Fetch the analysis to get the document text
            const analysisRes = await fetch(`/api/analysis/${item.id}`);
            if (!analysisRes.ok) throw new Error('Failed to fetch analysis');

            const analysisData = await analysisRes.json();

            // Create a text blob from the analysis content to ingest as a RAG document
            const textContent = [
                analysisData.summary || '',
                ...(analysisData.keyPoints || []),
                ...(analysisData.recommendations || []),
                analysisData.analysis?.details || '',
            ].filter(Boolean).join('\n\n');

            if (!textContent.trim()) {
                throw new Error('No content found in analysis');
            }

            // Create a File-like blob and send to RAG ingest
            const blob = new Blob([textContent], { type: 'text/plain' });
            const file = new File([blob], item.filename, { type: 'text/plain' });

            const formData = new FormData();
            formData.append('files', file);

            const ingestRes = await fetch('/api/rag/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!ingestRes.ok) {
                const errData = await ingestRes.json();
                throw new Error(errData.error || 'Ingestion failed');
            }

            toast.success(`"${item.filename}" added for chat`);
            // Navigate to dashboard with chat tab active
            router.push('/?tab=chat');
        } catch (error) {
            console.error('Error ingesting for chat:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to add document for chat');
        } finally {
            setIngestingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, item: AnalysisHistory) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirmation({
            isOpen: true,
            itemId: item.id,
            itemName: item.filename
        });
    };

    const closeDeleteConfirmation = () => {
        setDeleteConfirmation({
            isOpen: false,
            itemId: null,
            itemName: null
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.itemId) return;

        try {
            setIsDeleting(true);
            const response = await fetch(`/api/history?id=${deleteConfirmation.itemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            // Show success toast
            toast.success('Document deleted successfully');

            // Refresh history if callback provided
            if (onHistoryUpdated) {
                onHistoryUpdated();
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error('Failed to delete document');
        } finally {
            setIsDeleting(false);
            closeDeleteConfirmation();
        }
    };

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Toggle button */}
            <button
                onClick={toggle}
                className={`fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 rounded-md 
                bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
                shadow-sm transition-all duration-200 ease-in-out
                border border-gray-200 dark:border-gray-700`}
                aria-label={isOpen ? "Close history sidebar" : "Open history sidebar"}
            >
                {isOpen ? (
                    <ChevronLeftIcon className="h-5 w-5 text-primary dark:text-primary-light" />
                ) : (
                    <div className="relative">
                        <BookOpenIcon className="h-5 w-5 text-primary dark:text-primary-light" />
                        {history.length > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary dark:bg-primary-light text-[10px] font-medium text-white">
                                {history.length > 99 ? '99+' : history.length}
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* Rest of the sidebar */}
            <aside
                className={`
                fixed top-0 left-0 h-screen z-40
                w-72 bg-gradient-to-b from-gray-50 to-white dark:from-[#1E1E1E] dark:to-[#121212]
                border-r border-gray-200 dark:border-gray-700 
                shadow-xl rounded-tr-md rounded-br-md
                transform transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
                `}
            >
                {/* Enhanced header with curved design */}
                <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-10 ml-2 flex items-center justify-center">
                        <DocumentTextIcon className="h-5 w-5 text-primary dark:text-primary-light" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-3">Analysis History</h2>
                </div>

                {/* Enhanced history list with smoother items */}
                <div className="flex-1 overflow-y-auto py-3 px-2">
                    {history.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-primary/20 dark:border-primary-light/20">
                                <DocumentTextIcon className="mx-auto h-10 w-10 text-primary/40 dark:text-primary-light/40 mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No documents analyzed yet
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            {history.map((item) => {
                                const isActive = pathname === `/analysis/${item.id}`;

                                return (
                                    <div
                                        key={item.id}
                                        className="relative group"
                                    >
                                        <Link
                                            href={`/analysis/${item.id}`}
                                            className={`
                                                block px-4 py-3 mx-1 my-1 rounded-xl
                                                text-sm transition-all duration-200
                                                ${isActive
                                                    ? 'bg-primary/10 dark:bg-primary-light/10 shadow-sm border border-primary/30 dark:border-primary-light/30'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent hover:border-primary/20 dark:hover:border-primary-light/20'}
                                            `}
                                        >
                                            <div className="flex flex-col space-y-1 pr-14">
                                                <span className={`font-medium truncate ${isActive ? 'text-primary dark:text-primary-light' : ''}`}>
                                                    {item.filename}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                    <DocumentTextIcon className="h-3 w-3 mr-1 inline" />
                                                    {formatDate(item.createdAt)}
                                                </span>
                                            </div>
                                        </Link>

                                        {/* Action buttons */}
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-150`}>
                                            {/* Chat icon — ingest for RAG */}
                                            <button
                                                onClick={(e) => handleChatClick(e, item)}
                                                disabled={ingestingIds.has(item.id)}
                                                className={`p-1.5 rounded-full transition-all duration-150 ${ingestingIds.has(item.id)
                                                        ? 'text-primary animate-pulse'
                                                        : 'text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20'
                                                    }`}
                                                aria-label={`Add ${item.filename} for chat`}
                                                title="Add to chat — process with embeddings"
                                            >
                                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                            </button>

                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => handleDeleteClick(e, item)}
                                                className="p-1.5 rounded-full text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
                                                aria-label={`Delete ${item.filename}`}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>

            {/* Delete confirmation modal */}
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                title="Delete Document"
                message={`Are you sure you want to delete "${deleteConfirmation.itemName}"? This action cannot be undone.`}
                confirmText={isDeleting ? "Deleting..." : "Delete"}
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={closeDeleteConfirmation}
                isDestructive
            />

            {/* Animation styles */}
            <style jsx>{`
                @keyframes attention {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    }
                }
                .animate-attention {
                    animation: attention 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </>
    );
}