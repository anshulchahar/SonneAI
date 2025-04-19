'use client';

import Navigation from '@/components/Navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import Link from 'next/link';
import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function HelpPage() {
    const { isOpen } = useSidebar();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const faqs = [
        {
            question: 'How does Sonne work?',
            answer: 'Sonne uses advanced AI to analyze your documents, extract key information, and provide insights. Simply upload your document and our system will process it automatically.'
        },
        {
            question: 'What file formats are supported?',
            answer: 'Currently, we support PDF documents. We&apos;re working on expanding to other formats like DOCX, TXT, and more in the future.'
        },
        {
            question: 'How secure is my data?',
            answer: 'Your documents are encrypted in transit and at rest. We do not share your data with third parties. For more information, please see our Privacy Policy.'
        },
        {
            question: 'Can I save my analysis results?',
            answer: 'Yes! When you&apos;re signed in, all your document analyses are automatically saved to your history, and you can access them anytime.'
        },
        {
            question: 'Is there a limit to how many documents I can analyze?',
            answer: 'Free accounts can analyze up to 5 documents per month. For unlimited analyses, please check our pricing plans.'
        }
    ];

    const toggleFaq = (index: number) => {
        if (expandedFaq === index) {
            setExpandedFaq(null);
        } else {
            setExpandedFaq(index);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-200">
            <Navigation history={[]} />

            <div className={`pt-16 pb-8 w-full transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>
                <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
                    <div className="mx-auto w-full max-w-4xl">
                        <div className="bg-white dark:bg-[#2C2C2C] border dark:border-[#333333] rounded-lg shadow-lg p-6 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <QuestionMarkCircleIcon className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & FAQ</h1>
                            </div>

                            <div className="space-y-6">
                                <div className="text-lg text-gray-700 dark:text-gray-200">
                                    <p className="mb-4">
                                        Welcome to Sonne Help Center. Here you&apos;ll find answers to common questions and guidance on using our platform.
                                    </p>
                                    <p>
                                        If you can&apos;t find what you&apos;re looking for, please visit our{' '}
                                        <Link href="/contact" className="text-primary hover:underline transition-colors">
                                            Contact page
                                        </Link>{' '}
                                        to get in touch with our support team.
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>

                                    <div className="space-y-4 mt-6">
                                        {faqs.map((faq, index) => (
                                            <div
                                                key={index}
                                                className="border dark:border-[#333333] rounded-lg overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => toggleFaq(index)}
                                                    className="w-full flex justify-between items-center p-4 text-left bg-gray-50 dark:bg-[#3A3A3A] hover:bg-gray-100 dark:hover:bg-[#444444] transition-colors duration-200"
                                                >
                                                    <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                                                    <svg
                                                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedFaq === index ? 'transform rotate-180' : ''}`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <div className={`overflow-hidden transition-all duration-300 ${expandedFaq === index ? 'max-h-96' : 'max-h-0'}`}>
                                                    <div className="p-4 bg-white dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-200">
                                                        {faq.answer}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 