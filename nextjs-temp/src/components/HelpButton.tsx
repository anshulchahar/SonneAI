'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QuestionMarkCircleIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';

export default function HelpButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
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

    // Calculate button background based on state
    const getButtonBgColor = () => {
        if (isOpen) {
            return 'bg-primary dark:bg-primary';
        } else if (isHovered) {
            return 'bg-primary-light dark:bg-primary-light';
        } else {
            return 'bg-primary dark:bg-primary';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <motion.button
                ref={buttonRef}
                onClick={toggleMenu}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.1 }}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg ${getButtonBgColor()} transition-colors duration-200`}
                aria-label="Help"
            >
                <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-white" />
            </motion.button>

            {/* Dropdown menu with animation */}
            <div
                ref={menuRef}
                className={`absolute bottom-16 right-0 w-56 py-2 bg-white dark:bg-[#2C2C2C] rounded-lg shadow-lg border border-gray-200 dark:border-[#333333] transition-all duration-200 ease-in-out
                    ${isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-2 pointer-events-none'}`}
            >
                <div className="flex flex-col">
                    <Link
                        href="/help"
                        className="flex px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors duration-150"
                        onClick={() => setIsOpen(false)}
                    >
                        Help & FAQ
                    </Link>
                    <Link
                        href="/terms"
                        className="flex px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors duration-150"
                        onClick={() => setIsOpen(false)}
                    >
                        Terms & Policies
                    </Link>
                    <Link
                        href="/contact"
                        className="flex px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors duration-150"
                        onClick={() => setIsOpen(false)}
                    >
                        Contact Us
                    </Link>
                    <Link
                        href="/report"
                        className="flex px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3A] transition-colors duration-150"
                        onClick={() => setIsOpen(false)}
                    >
                        Report Illegal Content
                    </Link>
                </div>

                {/* Arrow pointing down */}
                <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white dark:bg-[#2C2C2C] border-r border-b border-gray-200 dark:border-[#333333] transform rotate-45"></div>
            </div>
        </div>
    );
} 