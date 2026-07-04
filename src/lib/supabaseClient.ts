import { createClient } from '@supabase/supabase-js';

/**
 * Single shared Supabase client for the whole app.
 *
 * Why a single instance: the client holds the logged-in user's session (JWT)
 * in memory + localStorage and refreshes it automatically. Creating more than
 * one instance would mean competing session states, so we export exactly one.
 *
 * Values come from Vite env vars (must be prefixed with VITE_ to be exposed to
 * the browser). They live in .env, which is git-ignored. See .env.example.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
