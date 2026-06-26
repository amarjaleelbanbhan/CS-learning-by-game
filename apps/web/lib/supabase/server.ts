import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env';

/**
 * Server Supabase client bound to the request cookies (for SSR auth + server
 * actions). Returns null when no project is configured.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        toSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
      ) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component (read-only cookies) — safe to ignore;
          // session refresh is handled by middleware.
        }
      },
    },
  });
}
