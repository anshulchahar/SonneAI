'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ArrowDownTrayIcon, DocumentTextIcon, DocumentIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { exportAnalysis } from '@/utils/exportUtils';
import type { AnalysisData } from '@/types/analysis';

interface DownloadButtonProps {
    analysisData: AnalysisData;
    className?: string;
}

export default function DownloadButton({ analysisData, className = '' }: DownloadButtonProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const downloadFormats = [
        { id: 'pdf', name: 'PDF Document', icon: DocumentTextIcon },
        { id: 'docx', name: 'Word Document (.docx)', icon: DocumentIcon },
        { id: 'md', name: 'Markdown (.md)', icon: CodeBracketIcon },
        { id: 'txt', name: 'Plain Text (.txt)', icon: DocumentTextIcon },
    ];

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDownload = async (format: string) => {
        setIsLoading(format);
        try {
            await exportAnalysis(format, analysisData);
        } catch (error) {
            console.error(`Error exporting to ${format}:`, error);
            alert(`Failed to generate ${format.toUpperCase()} file. Please try again.`);
        } finally {
            setIsLoading(null);
            setMenuOpen(false);
        }
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
            <Menu as="div">
                <MenuButton
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Download options"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                    <span>Download</span>
                </MenuButton>

                <MenuItems
                    static
                    className={`absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-[#333333] rounded-md bg-white dark:bg-[#2C2C2C] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 transition ease-out duration-100 ${menuOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}`}
                >
                    <div className="px-1 py-1">
                        {downloadFormats.map((format) => (
                            <MenuItem key={format.id}>
                                {({ active }) => (
                                    <button
                                        className={`${active ? 'bg-primary/10 dark:bg-primary/20 text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-200'
                                            } group flex w-full items-center rounded-md px-2 py-2 text-sm ${isLoading === format.id ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        onClick={() => handleDownload(format.id)}
                                        disabled={isLoading !== null}
                                    >
                                        {isLoading === format.id ? (
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <format.icon className="mr-2 h-5 w-5 text-primary" aria-hidden="true" />
                                        )}
                                        {format.name}
                                    </button>
                                )}
                            </MenuItem>
                        ))}
                    </div>
                </MenuItems>
            </Menu>
        </div>
    );
} 