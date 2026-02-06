'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UsageStatus {
    current: number;
    limit: number;
    limitReached: boolean;
    remaining: number;
}

interface UsageData {
    analyses: UsageStatus;
    conversations: UsageStatus;
}

export function useUsageLimits() {
    const { data: session } = useSession();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsage = useCallback(async () => {
        if (!session?.user) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/usage', {
                headers: { 'Cache-Control': 'no-cache' },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch usage');
            }

            const data = await res.json();
            setUsage(data.usage);
        } catch (err) {
            console.error('Error fetching usage:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch usage');
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    return {
        usage,
        loading,
        error,
        refetch: fetchUsage,
        canAnalyze: usage ? !usage.analyses.limitReached : true,
        canChat: usage ? !usage.conversations.limitReached : true,
    };
}
