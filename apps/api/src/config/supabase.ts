import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Use service role for backend admin tasks

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[SUPABASE] Missing Supabase environment variables. Some features may not work.');
}

/**
 * Supabase client with Service Role.
 * WARNING: Bypasses RLS! Treat as powerful admin instance.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
