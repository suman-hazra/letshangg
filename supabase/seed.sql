-- letshangg v1 seed: 5 curated preferences
-- Idempotent: safe to run multiple times.

insert into public.preference_options (label, emoji, activity_key, category) values
  ('Grab coffee',                 '☕', 'coffee',  'food'),
  ('Go for a hike',               '🥾', 'hike',    'outdoors'),
  ('Grab drinks',                 '🍹', 'drinks',  'food'),
  ('Get pizza (casual, low-key)', '🍕', 'pizza',   'food'),
  ('Visit a museum',              '🎨', 'museum',  'culture')
on conflict (activity_key) do nothing;
