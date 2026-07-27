import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/env';

/**
 * Refreshes the Supabase auth session on every request and writes the rotated cookies
 * back onto the response. Without this, `lib/supabase/server.ts` can read a session but
 * never renew one, so signed-in users would be silently logged out when the access token
 * expires (it explicitly defers refresh to "middleware" — this is that middleware).
 *
 * When no Supabase project is configured the app runs in local-only guest mode, so this
 * is a pass-through rather than a hard failure.
 */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Must be getUser(), not getSession(): only getUser() revalidates the token with the
  // auth server, which is what actually triggers the refresh-and-rotate.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip static assets and image optimisation — refreshing a session for a PNG is waste.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
