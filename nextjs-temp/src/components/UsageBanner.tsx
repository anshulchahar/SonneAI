'use client';

import { useUsageLimits } from '@/hooks/useUsageLimits';

interface UsageBannerProps {
    type: 'analysis' | 'conversation';
}

export default function UsageBanner({ type }: UsageBannerProps) {
    const { usage, loading } = useUsageLimits();

    if (loading || !usage) return null;

    const status = type === 'analysis' ? usage.analyses : usage.conversations;
    const label = type === 'analysis' ? 'analyses' : 'conversations';

    if (!status.limitReached && status.remaining > 1) return null;

    const isAtLimit = status.limitReached;
    const isNearLimit = !isAtLimit && status.remaining <= 1;

    return (
        <div
            className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${isAtLimit
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
        >
            <span className="text-lg">{isAtLimit ? '🚫' : '⚠️'}</span>
            <div>
                {isAtLimit ? (
                    <p>
                        <strong>Limit reached:</strong> You&apos;ve used all {status.limit} {label}.
                        Please delete an existing {type === 'analysis' ? 'analysis' : 'conversation'} to create a new one.
                    </p>
                ) : isNearLimit ? (
                    <p>
                        <strong>Almost at limit:</strong> You have {status.remaining} {label} remaining
                        out of {status.limit}.
                    </p>
                ) : null}
                <p className="text-xs mt-1 opacity-75">
                    Usage: {status.current}/{status.limit} {label}
                </p>
            </div>
        </div>
    );
}
