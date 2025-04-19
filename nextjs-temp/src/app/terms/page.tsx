'use client';

import Navigation from '@/components/Navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
    const { isOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-200">
            <Navigation history={[]} />

            <div className={`pt-16 pb-8 w-full transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>
                <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
                    <div className="mx-auto w-full max-w-4xl">
                        <div className="bg-white dark:bg-[#2C2C2C] border dark:border-[#333333] rounded-lg shadow-lg p-6 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <DocumentTextIcon className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms & Policies</h1>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h2>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-200">
                                            By using the Sonne service, you agree to be bound by the following terms and conditions.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">1. Acceptance of Terms</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            By accessing or using Sonne, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">2. Description of Service</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            Sonne provides AI-powered document analysis services. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">3. User Accounts</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            To use certain features of Sonne, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
                                        </p>
                                    </div>
                                </section>

                                <section className="mt-12 pt-8 border-t border-gray-200 dark:border-[#333333]">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h2>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-200">
                                            At Sonne, we take your privacy seriously. This policy explains how we collect, use, and protect your information.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">1. Information Collection</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We collect information you provide directly to us, including personal information and documents you upload for analysis.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">2. Use of Information</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We use collected information to provide, maintain, and improve our services, and to communicate with you about your account and our services.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">3. Data Security</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We implement appropriate security measures to protect your personal information. Your documents are encrypted in transit and at rest.
                                        </p>
                                    </div>
                                </section>

                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-[#333333]">
                                    <p>Last updated: June 15, 2023</p>
                                    <p>For questions about our terms or policies, please contact our support team.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 