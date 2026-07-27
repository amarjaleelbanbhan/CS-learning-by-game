'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { HoloButton } from '@/components/ui/HoloButton';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Magic-link sign-in (FR-AUTH-1). Deliberately passwordless: Supabase mails a one-time
 * link, so this app never handles, stores, or transmits a password at all.
 *
 * Renders nothing when no Supabase project is configured — guest mode is a supported
 * first-class state (FR-AUTH-3), not a degraded one, so there's no dead button to click.
 */
export function AuthButton() {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setSignedInAs(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedInAs(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return null;

  async function sendLink() {
    const supabase = createClient();
    if (!supabase || !email.trim()) return;
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? 'error' : 'sent');
  }

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSignedInAs(null);
  }

  if (signedInAs) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden max-w-[14ch] truncate text-xs text-ink-mid sm:inline"
          title={signedInAs}
        >
          {signedInAs}
        </span>
        <button
          onClick={signOut}
          className="rounded-lg border border-ink-low/25 px-2 py-1 text-xs text-ink-mid transition-colors hover:border-arc-cyan/40 hover:text-ink-hi"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-arc-cyan/30 px-2.5 py-1 text-xs text-arc-cyan transition-colors hover:bg-arc-cyan/10"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === 'sent' ? (
        <span className="text-xs text-accept">Check your email for the link.</span>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendLink()}
            placeholder="you@example.com"
            aria-label="Email address for sign-in link"
            className="w-40 rounded-lg border border-ink-low/25 bg-void/60 px-2 py-1 text-xs text-ink-hi outline-none focus:border-arc-cyan/50"
          />
          <HoloButton
            intent="ghost"
            onClick={sendLink}
            disabled={status === 'sending'}
            className="!px-2 !py-1 text-xs"
          >
            {status === 'sending' ? '…' : 'Send link'}
          </HoloButton>
        </>
      )}
      {status === 'error' && <span className="text-xs text-reject">Failed — try again.</span>}
    </div>
  );
}
