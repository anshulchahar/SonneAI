// src/__tests__/utils/usageLimits.test.ts
import { USAGE_LIMITS } from '../../utils/usageLimits';

// Mock supabase
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../lib/supabase', () => ({
    supabaseAdmin: {
        from: (...args: unknown[]) => {
            mockFrom(...args);
            return {
                select: (...selectArgs: unknown[]) => {
                    mockSelect(...selectArgs);
                    return {
                        eq: (...eqArgs: unknown[]) => {
                            mockEq(...eqArgs);
                            return Promise.resolve({ count: 2, error: null });
                        },
                    };
                },
            };
        },
    },
}));

// Import after mocking
import {
    checkAnalysisLimit,
    checkConversationLimit,
    getUserUsageStatus,
} from '../../utils/usageLimits';

describe('Usage Limits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('USAGE_LIMITS constants', () => {
        it('should define MAX_ANALYSES as 4', () => {
            expect(USAGE_LIMITS.MAX_ANALYSES).toBe(4);
        });

        it('should define MAX_CONVERSATIONS as 3', () => {
            expect(USAGE_LIMITS.MAX_CONVERSATIONS).toBe(3);
        });
    });

    describe('checkAnalysisLimit', () => {
        it('should return correct usage status when under limit', async () => {
            const result = await checkAnalysisLimit('test-user-id');

            expect(result).toEqual({
                current: 2,
                limit: USAGE_LIMITS.MAX_ANALYSES,
                limitReached: false,
                remaining: USAGE_LIMITS.MAX_ANALYSES - 2,
            });
            expect(mockFrom).toHaveBeenCalledWith('analysis');
            expect(mockEq).toHaveBeenCalledWith('userId', 'test-user-id');
        });
    });

    describe('checkConversationLimit', () => {
        it('should return correct usage status when under limit', async () => {
            const result = await checkConversationLimit('test-user-id');

            expect(result).toEqual({
                current: 2,
                limit: USAGE_LIMITS.MAX_CONVERSATIONS,
                limitReached: false,
                remaining: USAGE_LIMITS.MAX_CONVERSATIONS - 2,
            });
            expect(mockFrom).toHaveBeenCalledWith('conversations');
            expect(mockEq).toHaveBeenCalledWith('userId', 'test-user-id');
        });
    });

    describe('getUserUsageStatus', () => {
        it('should return both analysis and conversation status', async () => {
            const result = await getUserUsageStatus('test-user-id');

            expect(result).toHaveProperty('analyses');
            expect(result).toHaveProperty('conversations');
            expect(result.analyses.current).toBe(2);
            expect(result.conversations.current).toBe(2);
        });
    });
});
