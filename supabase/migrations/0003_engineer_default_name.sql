-- Player-identity pass: the player is an Engineer, not a "Recruit" —
-- aligning the default profile name with the in-game narrative (Automata
-- Academy). Existing rows already named 'Recruit' are updated too since no
-- real users have customized it yet.
alter table public.profiles alter column display_name set default 'Engineer';

update public.profiles set display_name = 'Engineer' where display_name = 'Recruit';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Engineer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
