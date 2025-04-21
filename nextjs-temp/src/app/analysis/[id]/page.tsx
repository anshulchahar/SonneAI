'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AnalysisResult, AnalysisHistory } from '@/types/api';
import { AnalysisData } from '@/types/analysis';
import AnalysisResults from '@/components/AnalysisResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import Navigation from '@/components/Navigation';
import { useSidebar } from '@/contexts/SidebarContext';

export default function AnalysisDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { data: session, status } = useSession();
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [history, setHistory] = useState<AnalysisHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isOpen } = useSidebar();

    // Use useCallback to memoize the fetchData function
    const fetchData = useCallback(async () => {
        try {
            // Fetch both analysis details and history in parallel
            const [analysisResponse, historyResponse] = await Promise.all([
                fetch(`/api/analysis/${id}`),
                fetch('/api/history', {
                    headers: { 'Cache-Control': 'no-cache' }
                })
            ]);

            if (!analysisResponse.ok) {
                const data = await analysisResponse.json();
                throw new Error(data.error || 'Failed to fetch analysis');
            }

            if (!historyResponse.ok) {
                console.error('Failed to fetch history, will continue with analysis only');
            }

            const analysisData = await analysisResponse.json();
            setAnalysis(analysisData);

            // If history fetch was successful, set it
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setHistory(historyData);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [id]); // Add id as dependency since it's used inside fetchData

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            setError('Please sign in to view this analysis');
            setLoading(false);
            return;
        }

        fetchData();
    }, [id, session, status, fetchData]); // Add fetchData to the dependency array

    if (status === 'loading' || loading) {
        return <LoadingSpinner fullScreen message="Loading analysis..." />;
    }

    if (error) {
        return (
            <>
                <Navigation history={history} onHistoryUpdated={fetchData} />
                <div className={`pt-16 ${isOpen ? 'pl-64' : 'pl-16'} transition-all duration-300 ease-in-out`}>
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <ErrorDisplay message={error} />
                        <div className="mt-6 flex justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!analysis) {
        return (
            <>
                <Navigation history={history} onHistoryUpdated={fetchData} />
                <div className={`pt-16 ${isOpen ? 'pl-64' : 'pl-16'} transition-all duration-300 ease-in-out`}>
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <ErrorDisplay message="Analysis not found" />
                        <div className="mt-6 flex justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation history={history} onHistoryUpdated={fetchData} />
            <div className={`pt-16 pb-24 ${isOpen ? 'pl-64' : 'pl-16'} transition-all duration-300 ease-in-out`}>
                <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                    <div className="mx-auto w-full md:w-[90%] lg:w-[85%] xl:w-[90%] 2xl:w-[95%]">
                        <div className="my-6 flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate max-w-2xl">
                                {analysis.fileInfo[0]?.filename || 'Analysis Result'}
                            </h1>
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                New Analysis
                            </Link>
                        </div>

                        <div className="shadow-sm rounded-lg p-6 pb-8 dark:bg-[#1E1E1E] bg-gray-50">
                            <AnalysisResults analysis={{
                                ...analysis,
                                recommendations: analysis.recommendations || []
                            } as unknown as AnalysisData} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}