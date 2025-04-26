'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import ErrorMessage from './ErrorMessage';
import { useSidebar } from '@/contexts/SidebarContext';

interface PromptInputBarProps {
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    onAnalyze: () => void;
    canAnalyze: boolean;
    isAnalyzing: boolean;
    buttonText?: string;
    placeholder?: string;
    helperText?: string;
    errorMessage?: string;
    // Remove unused props or comment them if needed for future use
    // outputLength?: number;
    // onOutputLengthChange?: (length: number) => void;
}

export default function PromptInputBar({
    customPrompt,
    onCustomPromptChange,
    onAnalyze,
    canAnalyze,
    isAnalyzing,
    buttonText = 'Analyze',
    helperText = 'Press Enter to submit • Shift+Enter for new line',
    errorMessage = '',
    // Remove unused parameters or prefix with underscore
    // outputLength = 1000,
    // onOutputLengthChange = () => { }
}: PromptInputBarProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localError, setLocalError] = useState('');
    const { isOpen } = useSidebar(); // Get sidebar state to adjust position
    const [isMobile, setIsMobile] = useState(false);

    // Check if we're on a mobile device and track screen width
    useEffect(() => {
        const checkScreenDimensions = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
        };

        // Initial check
        checkScreenDimensions();

        // Listen for window resize
        window.addEventListener('resize', checkScreenDimensions);

        // Cleanup
        return () => window.removeEventListener('resize', checkScreenDimensions);
    }, []);

    // Auto-resize the textarea as content grows
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 150); // Max height of 150px
        textarea.style.height = `${newHeight}px`;
    }, [customPrompt]);

    const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onCustomPromptChange(e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (but not with Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            if (!canAnalyze && !isAnalyzing) {
                setLocalError('Please upload a document before proceeding');
                return;
            }

            if (!isAnalyzing) {
                setLocalError(''); // Clear any previous errors
                onAnalyze();
            }
        }
    };

    // Show either the passed error or the local error
    const displayError = errorMessage || localError;

    // Send icon SVG
    const SendIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
        >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
    );

    // Calculate the centering style based on sidebar state and screen size
    const getPromptBarStyle = () => {
        // On mobile, don't adjust positioning and provide padding for the help button
        if (isMobile) {
            return {
                paddingRight: '4rem' // Add padding to avoid overlap with help button
            };
        }

        // On desktop/tablet with sidebar open, adjust to center in remaining space
        if (isOpen) {
            return {
                width: 'calc(100% - 256px)', // Sidebar width is 256px (w-64)
                left: '256px',
                paddingRight: '4.5rem' // Add padding to avoid overlap with help button
            };
        }

        // Default position when sidebar is closed
        return {
            width: '100%',
            left: '0',
            paddingRight: '4.5rem' // Add padding to avoid overlap with help button
        };
    };

    return (
        <div
            className={`
                fixed bottom-0 z-10 pb-4 px-3 sm:px-6 lg:px-8 
                bg-gradient-to-t from-gray-50 via-gray-50 to-transparent 
                dark:from-[#1E1E1E] dark:via-[#1E1E1E] dark:to-transparent 
                transition-all duration-300 ease-in-out
                w-full
            `}
            style={getPromptBarStyle()}
        >
            <div className="mx-auto max-w-full sm:max-w-3xl w-full md:w-[90%] lg:w-[85%] xl:w-[90%] 2xl:w-[95%] flex flex-col items-center">
                <div className="w-full">
                    <div className={`relative flex items-center shadow-md border ${displayError ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#2C2C2C] rounded-full px-2 py-1.5 sm:px-4`}>
                        <textarea
                            ref={textareaRef}
                            value={customPrompt}
                            onChange={handlePromptChange}
                            onKeyDown={handleKeyDown}
                            disabled={isAnalyzing}
                            className={`flex-1 px-1 sm:px-2 py-1 text-sm sm:text-base resize-none overflow-hidden focus:outline-none bg-transparent text-gray-900 dark:text-white ${displayError ? 'focus:ring-red-500' : ''}`}
                            style={{ maxHeight: '100px', minHeight: '28px' }}
                            rows={1}
                            aria-label="Type a message"
                            aria-invalid={!!displayError}
                        />

                        {/* Submit button */}
                        <button
                            onClick={() => {
                                if (!canAnalyze && !isAnalyzing) {
                                    setLocalError('Please upload a document before proceeding');
                                    return;
                                }

                                if (!isAnalyzing) {
                                    setLocalError(''); // Clear any previous errors
                                    onAnalyze();
                                }
                            }}
                            disabled={isAnalyzing}
                            title={canAnalyze ? `Press Enter to ${buttonText.toLowerCase()}` : "Upload a document first"}
                            aria-label={buttonText}
                            className={`p-1 rounded-full flex items-center justify-center text-white transition-colors min-w-7 min-h-7 sm:min-w-8 sm:min-h-8 ${!isAnalyzing
                                ? 'bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                                : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                }`}
                        >
                            {isAnalyzing ? (
                                <div className="flex items-center">
                                    <span className="inline-block w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="inline-block ml-1 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="inline-block ml-1 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                </div>
                            ) : (
                                <SendIcon />
                            )}
                        </button>
                    </div>

                    <ErrorMessage message={displayError} className="ml-1 mt-1 text-sm" />

                    {!displayError && canAnalyze && !isAnalyzing && (
                        <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {helperText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}