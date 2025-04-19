'use client';

import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignIn() {
    const { status } = useSession();
    const router = useRouter();

    // If already signed in, redirect to home page
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    const handleGoogleSignIn = async () => {
        await signIn('google', { callbackUrl: '/' });
    };

    // If loading or authenticated, show nothing (will redirect)
    if (status === 'loading' || status === 'authenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Only show sign-in if not authenticated
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Welcome to Sonne
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to analyze your documents
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Image
                            src="/google.svg"
                            alt="Google"
                            width={20}
                            height={20}
                            className="mr-2"
                        />
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
}