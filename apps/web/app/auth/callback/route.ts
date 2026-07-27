import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Magic-link landing route. Supabase redirects here with a one-time `code`, which we
 * exchange for a cookie session (the cookie writes happen through the server client's
 * setAll, and are persisted because a Route Handler has writable cookies).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=missing-code`);
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/?auth=unconfigured`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Don't leak the provider's raw error text into a URL the user can see/share.
    return NextResponse.redirect(`${origin}/?auth=failed`);
  }

  // Only ever redirect to a same-origin path, never an attacker-supplied absolute URL.
  const safePath = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
  return NextResponse.redirect(`${origin}${safePath}`);
}
