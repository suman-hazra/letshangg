-- letshangg preference catalog
-- Idempotent: safe to run multiple times. New activities added later won't
-- disturb existing user_preferences rows.

insert into public.preference_options (label, emoji, activity_key, category) values
  ('Grab coffee',                 '☕', 'coffee',     'food'),
  ('Try a new restaurant',        '🍜', 'restaurant', 'food'),
  ('Go for a hike',               '🥾', 'hike',       'outdoors'),
  ('Catch a live show',           '🎵', 'show',       'culture'),
  ('Visit a museum',              '🎨', 'museum',     'culture'),
  ('Hang at the park',            '🌳', 'park',       'outdoors'),
  ('Watch a movie',               '🎬', 'movie',      'culture'),
  ('Get pizza (casual, low-key)', '🍕', 'pizza',      'food'),
  ('Go thrifting',                '🛍️', 'thrift',     'culture'),
  ('Take a workout class',        '🧘', 'workout',    'active'),
  ('Grab drinks',                 '🍹', 'drinks',     'food'),
  ('Game night',                  '🎮', 'game_night', 'casual'),
  ('Bowling',                     '🎳', 'bowling',    'active'),
  ('Bike ride',                   '🚴', 'bike',       'outdoors'),
  ('Sunset walk',                 '🌅', 'sunset_walk','outdoors'),
  ('Ice cream run',               '🍦', 'ice_cream',  'food'),
  ('Bookstore browse',            '📚', 'bookstore',  'casual'),
  ('Karaoke',                     '🎤', 'karaoke',    'nightlife'),
  ('Beach / waterfront day',      '🏖️', 'beach',      'outdoors'),
  ('Cook a meal together',        '🍳', 'cooking',    'casual')
on conflict (activity_key) do nothing;
