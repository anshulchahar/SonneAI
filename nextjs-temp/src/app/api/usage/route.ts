import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/config/auth';
import { getUserUsageStatus } from '@/utils/usageLimits';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/usage - Get usage status for the current user
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const usage = await getUserUsageStatus(session.user.id);
        return NextResponse.json({ usage });
    } catch (error) {
        console.error('Error fetching usage status:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch usage status' },
            { status: 500 }
        );
    }
}
