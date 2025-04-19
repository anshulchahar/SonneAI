'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut, signIn, useSession } from 'next-auth/react';
import DarkModeToggle from './DarkModeToggle';
import Image from 'next/image';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    const isActive = (path: string) => {
        return pathname === path;
    };

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'History', href: '/history' },
        { name: 'About', href: '/about' },
    ];

    // Handle sign in directly with Google
    const handleSignIn = () => {
        signIn('google', { callbackUrl: '/' });
    };

    return (
        <nav className="bg-gray-100 dark:bg-gray-800 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="flex items-center">
                                <Image
                                    src="/sonne.png"
                                    alt="Sonne Logo"
                                    width={32}
                                    height={32}
                                    className="h-8 w-auto"
                                />
                                <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    Sonne
                                </span>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${isActive(link.href)
                                        ? 'border-gold-500 text-gray-900 dark:text-white'
                                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white'
                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <DarkModeToggle />

                        {session ? (
                            <div className="ml-3 relative flex items-center space-x-4">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {session.user?.name || session.user?.email}
                                </span>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSignIn}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                Sign in
                            </button>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <DarkModeToggle />

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            type="button"
                            className="ml-2 bg-white dark:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Icon when menu is closed */}
                            {!isMenuOpen ? (
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            ) : (
                                /* Icon when menu is open */
                                <svg
                                    className="block h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`${isActive(link.href)
                                    ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300'
                                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-white'
                                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                        {session ? (
                            <>
                                <div className="px-4">
                                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                        {session.user?.name || 'User'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {session.user?.email || ''}
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="px-4 py-2">
                                <button
                                    onClick={handleSignIn}
                                    className="block text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                                >
                                    Sign in
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}