-- Achievement catalog (content; safe to re-run).
insert into public.achievements (id, title, description, icon) values
  ('first-boot',     'First Boot',          'Entered the ARC Reactor laboratory.',                 '⚡'),
  ('dfa-initiate',   'DFA Initiate',        'Completed your first DFA mission.',                   '🔷'),
  ('subset-master',  'Subset Master',       'Turned a nondeterministic machine deterministic.',    '🌀'),
  ('streak-3',       'Warming Up',          'Maintained a 3-day learning streak.',                 '🔥'),
  ('level-5',        'Reactor Online',      'Reached level 5.',                                    '🏅')
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      icon = excluded.icon;
