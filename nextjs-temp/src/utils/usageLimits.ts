import { supabaseAdmin } from '@/lib/supabase';

/**
 * Usage limits per user (free tier)
 */
export const USAGE_LIMITS = {
    /** Maximum number of document analyses per user */
    MAX_ANALYSES: 4,
    /** Maximum number of RAG chat conversations per user */
    MAX_CONVERSATIONS: 3,
};

export interface UsageStatus {
    /** Current count of the resource */
    current: number;
    /** Maximum allowed */
    limit: number;
    /** Whether the user has reached the limit */
    limitReached: boolean;
    /** Remaining uses */
    remaining: number;
}

/**
 * Get the number of analyses a user has performed
 */
export async function getAnalysisCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('analysis')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId);

    if (error) {
        console.error('Error counting analyses:', error);
        throw new Error('Failed to check usage limits');
    }

    return count ?? 0;
}

/**
 * Get the number of RAG conversations a user has created
 */
export async function getConversationCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId);

    if (error) {
        console.error('Error counting conversations:', error);
        throw new Error('Failed to check usage limits');
    }

    return count ?? 0;
}

/**
 * Check if the user can create a new analysis
 */
export async function checkAnalysisLimit(userId: string): Promise<UsageStatus> {
    const current = await getAnalysisCount(userId);
    return {
        current,
        limit: USAGE_LIMITS.MAX_ANALYSES,
        limitReached: current >= USAGE_LIMITS.MAX_ANALYSES,
        remaining: Math.max(0, USAGE_LIMITS.MAX_ANALYSES - current),
    };
}

/**
 * Check if the user can create a new conversation
 */
export async function checkConversationLimit(userId: string): Promise<UsageStatus> {
    const current = await getConversationCount(userId);
    return {
        current,
        limit: USAGE_LIMITS.MAX_CONVERSATIONS,
        limitReached: current >= USAGE_LIMITS.MAX_CONVERSATIONS,
        remaining: Math.max(0, USAGE_LIMITS.MAX_CONVERSATIONS - current),
    };
}

/**
 * Get full usage status for a user (both analyses and conversations)
 */
export async function getUserUsageStatus(userId: string): Promise<{
    analyses: UsageStatus;
    conversations: UsageStatus;
}> {
    const [analyses, conversations] = await Promise.all([
        checkAnalysisLimit(userId),
        checkConversationLimit(userId),
    ]);

    return { analyses, conversations };
}
