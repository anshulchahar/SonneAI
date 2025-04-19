'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { DocumentIcon, AcademicCapIcon, ChatBubbleBottomCenterTextIcon, ClipboardIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { AnalysisData } from '@/types/analysis';
import DownloadButton from './DownloadButton';

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface AnalysisResultsProps {
    analysis: AnalysisData;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
    const [categories] = useState([
        { id: 'summary', name: 'Summary', icon: DocumentIcon },
        { id: 'keyPoints', name: 'Key Points', icon: AcademicCapIcon },
        { id: 'detailedAnalysis', name: 'Details', icon: ChatBubbleBottomCenterTextIcon },
        { id: 'recommendations', name: 'Recommendations', icon: ClipboardIcon },
        { id: 'comparison', name: 'Comparison', icon: DocumentDuplicateIcon },
    ]);

    return (
        <div className="bg-white dark:bg-[var(--card)] shadow-lg dark:shadow-md border border-gray-100 dark:border-[var(--border)] rounded-lg overflow-hidden w-full mb-8 transition-colors duration-200">
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <DownloadButton analysisData={analysis} className="w-full md:w-auto" />
                </div>

                <Tab.Group>
                    <Tab.List className="flex p-1 space-x-1 bg-blue-50 dark:bg-[var(--secondary)] rounded-xl overflow-x-auto">
                        {categories.map((category) => (
                            <Tab
                                key={category.id}
                                className={({ selected }) =>
                                    classNames(
                                        'w-full py-2.5 text-sm font-medium flex items-center justify-center whitespace-nowrap',
                                        'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-[var(--primary)] transition-all duration-200',
                                        selected
                                            ? 'bg-white dark:bg-[var(--card)] shadow text-[var(--primary)] dark:text-[var(--primary)]'
                                            : 'text-gray-600 dark:text-[var(--muted-foreground)] hover:bg-white/[0.12] dark:hover:bg-[var(--accent)] hover:text-gray-700 dark:hover:text-[var(--accent-foreground)]'
                                    )
                                }
                            >
                                <category.icon className="w-5 h-5 mr-2" />
                                {category.name}
                            </Tab>
                        ))}
                    </Tab.List>
                    <Tab.Panels className="mt-4">
                        {/* Summary Panel */}
                        <Tab.Panel className="p-3">
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-[var(--card-foreground)]">Summary</h3>
                                <p className="whitespace-pre-line text-gray-700 dark:text-[var(--muted-foreground)]">{analysis.summary || 'No summary available.'}</p>
                            </div>
                            {analysis.fileInfo && analysis.fileInfo.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-[var(--card-foreground)]">File Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {analysis.fileInfo.map((file, index) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-[var(--accent)] rounded-lg border border-gray-100 dark:border-[var(--border)]">
                                                <DocumentIcon className="h-6 w-6 text-[var(--primary)]" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-[var(--card-foreground)]">{file.filename}</p>
                                                    <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                                                        {file.pages && `${file.pages} pages • `}
                                                        {file.fileSize}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Tab.Panel>

                        {/* Key Points Panel */}
                        <Tab.Panel className="p-3">
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-[var(--card-foreground)]">Key Points</h3>
                                {analysis.keyPoints && analysis.keyPoints.length > 0 ? (
                                    <ul className="space-y-3">
                                        {analysis.keyPoints.map((point, index) => (
                                            <li key={index} className="flex space-x-3">
                                                <svg
                                                    className="h-6 w-6 flex-shrink-0 text-[var(--primary)]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <span className="text-gray-700 dark:text-[var(--card-foreground)]">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-700 dark:text-[var(--muted-foreground)]">No key points available.</p>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Detailed Analysis Panel */}
                        <Tab.Panel className="p-3">
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-[var(--card-foreground)]">Detailed Analysis</h3>
                                <p className="whitespace-pre-line text-gray-700 dark:text-[var(--muted-foreground)]">{analysis.detailedAnalysis || 'No detailed analysis available.'}</p>
                            </div>
                        </Tab.Panel>

                        {/* Recommendations Panel */}
                        <Tab.Panel className="p-3">
                            <div className="prose dark:prose-invert max-w-none">
                                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-[var(--card-foreground)]">Recommendations</h3>
                                {analysis.recommendations && analysis.recommendations.length > 0 ? (
                                    <ul className="space-y-3">
                                        {analysis.recommendations.map((recommendation, index) => (
                                            <li key={index} className="flex space-x-3">
                                                <svg
                                                    className="h-6 w-6 flex-shrink-0 text-[var(--primary)]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <span className="text-gray-700 dark:text-[var(--card-foreground)]">{recommendation}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-700 dark:text-[var(--muted-foreground)]">No recommendations available.</p>
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Comparison Panel */}
                        <Tab.Panel className="p-3">
                            {analysis.documentComparison ? (
                                <div className="prose dark:prose-invert max-w-none">
                                    <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-[var(--card-foreground)]">Document Comparison</h3>
                                    <p className="whitespace-pre-line text-gray-700 dark:text-[var(--muted-foreground)]">{analysis.documentComparison}</p>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500 dark:text-[var(--muted-foreground)]">
                                    <p>No document comparison available.</p>
                                    <p className="text-sm mt-2">This feature is available when analyzing multiple documents.</p>
                                </div>
                            )}
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
}