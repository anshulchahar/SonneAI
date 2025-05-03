import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get environment variables
const supabaseUrl = process.env.DB_NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.DB_NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.DB_SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with anonymous key (for public operations)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create an admin client with service role key (for server-side operations)
export const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey
);

// Helper for server-side API routes
export const getServerSupabase = () => {
    return supabaseAdmin;
};

export default supabase;