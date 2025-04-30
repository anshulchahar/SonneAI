'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
    QuestionMarkCircleIcon,
    DocumentTextIcon, 
    EnvelopeIcon, 
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function HelpButton() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-light hover:from-primary-dark hover:to-primary dark:from-primary-light dark:to-primary dark:hover:from-primary dark:hover:to-primary-light shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out ${isOpen ? 'ring-2 ring-primary-light ring-opacity-60' : 'animate-pulse-subtle'}`}
                aria-label="Help"
            >
                {/* Modern question mark with glow effect */}
                <span className="text-white font-bold text-xl drop-shadow-md">?</span>
            </button>

            {/* Modern dropdown menu with animation */}
            <div
                ref={menuRef}
                className={`absolute bottom-14 right-0 w-64 py-3 bg-gradient-to-b from-white to-gray-50 dark:from-[#333333] dark:to-[#222222] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out backdrop-blur-sm ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-4 pointer-events-none scale-95'}`}
            >
                <div className="flex flex-col space-y-1">
                    <Link
                        href="/help"
                        className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary hover:bg-opacity-10 dark:hover:bg-primary-light dark:hover:bg-opacity-10 transition-colors duration-150 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                        <span>Help & FAQ</span>
                    </Link>
                    <Link
                        href="/terms"
                        className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary hover:bg-opacity-10 dark:hover:bg-primary-light dark:hover:bg-opacity-10 transition-colors duration-150 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                    >
                        <DocumentTextIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                        <span>Terms & Policies</span>
                    </Link>
                    <Link
                        href="/contact"
                        className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary hover:bg-opacity-10 dark:hover:bg-primary-light dark:hover:bg-opacity-10 transition-colors duration-150 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                    >
                        <EnvelopeIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                        <span>Contact Us</span>
                    </Link>
                    <Link
                        href="/report"
                        className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-primary hover:bg-opacity-10 dark:hover:bg-primary-light dark:hover:bg-opacity-10 transition-colors duration-150 rounded-md mx-2"
                        onClick={() => setIsOpen(false)}
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 text-primary dark:text-primary-light" />
                        <span>Report Illegal Content</span>
                    </Link>
                </div>

                {/* Modern arrow with matching gradient */}
                <div className="absolute -bottom-2.5 right-5 w-5 h-5 bg-gray-50 dark:bg-[#222222] border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45 shadow-md"></div>
            </div>
            
            {/* Add this CSS for the subtle pulse animation */}
            <style jsx>{`
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}