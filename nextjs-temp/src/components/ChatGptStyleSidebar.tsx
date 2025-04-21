'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { AnalysisHistory } from '@/types/api';
import { formatDate } from '@/utils/formatters';
import { useSidebar } from '@/contexts/SidebarContext';
import { Bars3Icon, TrashIcon } from '@heroicons/react/24/outline';
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
                    className="md:hidden fixed inset-0 bg-black/30 z-40"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Toggle button - fixed in top-left corner */}
            <button
                onClick={toggle}
                className="fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-[#1E1E1E] dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out"
                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
                <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Main sidebar with title next to toggle */}
            <aside
                className={`
          fixed top-0 left-0 h-screen z-40
          w-64 bg-gray-50 dark:bg-[#1E1E1E]
          border-r border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
            >
                {/* Header with title to the right of toggle */}
                <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-10 ml-2"></div>
                    <h2 className="text-base font-medium text-gray-800 dark:text-gray-200 ml-5">Analysis History</h2>
                </div>

                {/* History list */}
                <div className="flex-1 overflow-y-auto pt-2">
                    {history.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No documents analyzed yet
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
                                                block px-4 py-3 mx-2 my-1 rounded-md
                                                text-sm transition-colors duration-150
                                                ${isActive
                                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'}
                                            `}
                                        >
                                            <div className="flex flex-col space-y-1 pr-7">
                                                <span className={`font-medium truncate ${isActive ? 'text-gray-900 dark:text-white' : ''}`}>
                                                    {item.filename}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(item.createdAt)}
                                                </span>
                                            </div>
                                        </Link>

                                        {/* Delete button - appears on hover or when active */}
                                        <button
                                            onClick={(e) => handleDeleteClick(e, item)}
                                            className={`
                                                absolute right-3 top-1/2 -translate-y-1/2
                                                p-1.5 rounded-full
                                                text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400
                                                hover:bg-gray-100 dark:hover:bg-gray-700
                                                transition-opacity duration-150
                                                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                            `}
                                            aria-label={`Delete ${item.filename}`}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
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
        </>
    );
}