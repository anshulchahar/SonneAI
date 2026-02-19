import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get environment variables
const supabaseUrl = process.env.DB_NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.DB_NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.DB_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables: DB_NEXT_PUBLIC_SUPABASE_URL and DB_NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a Supabase client with anonymous key (for public operations)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create an admin client with service role key (for server-side operations)
// WARNING: Service role key is required for auth operations (user creation, account linking)
if (!supabaseServiceKey) {
    console.error('CRITICAL: DB_SUPABASE_SERVICE_ROLE_KEY is not set. Auth operations (sign-in, account creation) WILL FAIL due to RLS policies blocking the anon key.');
}
export const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Helper for server-side API routes
export const getServerSupabase = () => {
    return supabaseAdmin;
};

export default supabase;