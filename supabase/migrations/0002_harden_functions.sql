-- Security hardening (from Supabase advisor review):
-- pin search_path on the updated_at trigger fn, and remove direct REST/RPC
-- executability from internal trigger functions. Triggers still fire normally.
alter function public.set_updated_at() set search_path = '';

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
