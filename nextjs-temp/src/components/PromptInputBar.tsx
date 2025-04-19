'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import ErrorMessage from './ErrorMessage';
import { useSidebar } from '@/contexts/SidebarContext';
import OutputLengthSlider from './OutputLengthSlider';

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
    outputLength?: number;
    onOutputLengthChange?: (length: number) => void;
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
    outputLength = 500,
    onOutputLengthChange = () => { }
}: PromptInputBarProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localError, setLocalError] = useState('');
    const { isOpen } = useSidebar(); // Get sidebar state to adjust position
    const [isMobile, setIsMobile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Check if we're on a mobile device
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkIfMobile();

        // Listen for window resize
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
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

    // Settings icon SVG
    const SettingsIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
        >
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.986.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
        </svg>
    );

    // Calculate the centering style based on sidebar state and screen size
    const getPromptBarStyle = () => {
        // On mobile, don't adjust positioning
        if (isMobile) {
            return {};
        }
        // On desktop/tablet with sidebar open, adjust to center in remaining space
        if (isOpen) {
            return {
                width: 'calc(100% - 256px)', // Sidebar width is 256px (w-64)
                left: '256px',
            };
        }
        // Default position when sidebar is closed
        return {
            width: '100%',
            left: '0',
        };
    };

    return (
        <div
            className={`
                fixed bottom-0 z-10 pb-4 px-4 sm:px-6 lg:px-8 
                bg-gradient-to-t from-gray-50 via-gray-50 to-transparent 
                dark:from-[#1E1E1E] dark:via-[#1E1E1E] dark:to-transparent 
                transition-all duration-300 ease-in-out
            `}
            style={getPromptBarStyle()}
        >
            <div className="max-w-3xl mx-auto">
                {showSettings && (
                    <div className="mb-3 p-4 rounded-xl bg-white dark:bg-[#2C2C2C] border border-gray-200 dark:border-gray-700 shadow-lg transition-all">
                        <div className="mb-2 flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Output Settings</h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <OutputLengthSlider
                            value={outputLength}
                            onChange={onOutputLengthChange}
                            min={100}
                            max={1000}
                            step={50}
                        />
                    </div>
                )}

                <div className={`relative max-w-3xl mx-auto flex items-center shadow-md border ${displayError ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-[#2C2C2C] rounded-full px-3 py-1.5 sm:px-4`}>
                    {/* Settings button - moved to the left side */}
                    <button
                        onClick={() => setShowSettings(prev => !prev)}
                        disabled={isAnalyzing}
                        title="Output settings"
                        aria-label="Output settings"
                        className={`p-1 rounded-full flex items-center justify-center transition-colors min-w-8 min-h-8 ${!isAnalyzing
                            ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        <SettingsIcon />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={customPrompt}
                        onChange={handlePromptChange}
                        onKeyDown={handleKeyDown}
                        disabled={isAnalyzing}
                        className={`flex-1 px-2 py-1 text-base resize-none overflow-hidden focus:outline-none bg-transparent text-gray-900 dark:text-white ${displayError ? 'focus:ring-red-500' : ''}`}
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
                        className={`p-1 rounded-full flex items-center justify-center text-white transition-colors min-w-8 min-h-8 ${!isAnalyzing
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

                <ErrorMessage message={displayError} className="ml-1 mt-1" />

                {!displayError && canAnalyze && !isAnalyzing && (
                    <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {helperText}
                    </div>
                )}
            </div>
        </div>
    );
}