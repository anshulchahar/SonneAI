'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Create a simple theme hook that doesn't throw
const useLocalTheme = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Initialize from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
            if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
                setTheme(storedTheme);
                document.documentElement.classList.toggle('dark', storedTheme === 'dark');
            } else {
                // Check system preference
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(isDark ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', isDark);
            }
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', nextTheme);
            document.documentElement.classList.toggle('dark', nextTheme === 'dark');
        }
    };

    return { theme, toggleTheme };
};

export default function DarkModeToggle({ className = '' }: { className?: string }) {
    const [mounted, setMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Always use our local hook that doesn't throw
    const { theme, toggleTheme } = useLocalTheme();

    // After mounting, we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Prevent hydration mismatch by not rendering anything until mounted
        return <div className={`w-10 h-10 ${className}`} />;
    }

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <motion.button
                onClick={toggleTheme}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-gray-200/30 hover:bg-gray-200/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                whileTap={{ scale: 0.9 }}
                aria-label={`Current theme: ${theme}. Click to toggle theme.`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                {theme === 'light' ? (
                    <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-amber-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </motion.svg>
                ) : (
                    <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </motion.svg>
                )}
            </motion.button>

            {isHovered && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-md px-3 py-1 text-xs font-medium shadow-md whitespace-nowrap z-50"
                >
                    {theme === 'light' ? 'Light' : 'Dark'} mode
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700"></div>
                </motion.div>
            )}
        </div>
    );
}