/**
 * Supabase connection config. The app degrades gracefully when these are unset
 * (local-only mode), so development and CI never hard-fail on a missing backend.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when a Supabase project is configured; gates all cloud features. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
