-- Expand onboarding preferences from binary yay/nay to yay/meh/nay and
-- replace the active quiz catalog with the 30 activity probes.

alter table public.preference_options
  add column if not exists quiz_order int,
  add column if not exists energy text,
  add column if not exists social_setting text,
  add column if not exists physical_exertion text,
  add column if not exists novelty text,
  add column if not exists setting text,
  add column if not exists typical_cost text,
  add column if not exists time_needed text,
  add column if not exists is_active boolean not null default true;

alter table public.user_preferences
  drop constraint if exists user_preferences_verdict_check;

alter table public.user_preferences
  add constraint user_preferences_verdict_check
  check (verdict in ('yay', 'meh', 'nay'));

insert into public.preference_options (
  label,
  emoji,
  activity_key,
  category,
  quiz_order,
  energy,
  social_setting,
  physical_exertion,
  novelty,
  setting,
  typical_cost,
  time_needed,
  is_active
) values
  ('Grab coffee', null, 'coffee', 'Relaxed & Intimate', 1, 'Low', '1:1 / Small', 'Low', 'Routine', 'Indoor', '$', 'Quick (<1h)', true),
  ('Get pizza (casual, low-key)', null, 'pizza', 'Relaxed & Intimate', 2, 'Low', 'Small group', 'Low', 'Routine', 'Indoor', '$', 'Quick-1h', true),
  ('Watch a movie', null, 'movie', 'Relaxed & Intimate', 3, 'Low', '1:1 / Small', 'Low', 'Routine', 'Indoor', '$$', 'Half-event', true),
  ('Grab drinks', null, 'drinks', 'Social & Energetic', 4, 'Medium', 'Small / Crowd', 'Low', 'Moderate', 'Indoor', '$$', 'Half-event', true),
  ('Go to a house party / get-together', null, 'house_party', 'Social & Energetic', 5, 'High', 'Crowd', 'Low', 'Moderate', 'Indoor', '$', 'Full event', true),
  ('Go dancing / night out', null, 'dancing', 'Social & Energetic', 6, 'High', 'Crowd', 'Medium', 'Moderate', 'Indoor', '$$', 'Full event', true),
  ('Take a workout class', null, 'workout', 'Active & Sporty', 7, 'Medium', 'Small / Crowd', 'High', 'Moderate', 'Indoor', '$$', '1h', true),
  ('Bike ride', null, 'bike', 'Active & Sporty', 8, 'Medium', '1:1 / Small', 'High', 'Moderate', 'Outdoor', '$', 'Half-day', true),
  ('Play a pickup sport', null, 'pickup_sport', 'Active & Sporty', 9, 'High', 'Small / Crowd', 'High', 'Moderate', 'Either', '$', 'Half-day', true),
  ('Go rock climbing', null, 'rock_climbing', 'Active & Sporty', 10, 'High', '1:1 / Small', 'High', 'Novel', 'Either', '$$', 'Half-day', true),
  ('Go for a hike', null, 'hike', 'Outdoorsy & Nature', 11, 'Medium', '1:1 / Small', 'High', 'Moderate', 'Outdoor', '$', 'Half-day', true),
  ('Hang at the park', null, 'park', 'Outdoorsy & Nature', 12, 'Low', 'Small group', 'Low', 'Routine', 'Outdoor', '$', 'Half-day', true),
  ('Sunset walk', null, 'sunset_walk', 'Outdoorsy & Nature', 13, 'Low', '1:1', 'Low', 'Routine', 'Outdoor', '$', 'Quick-1h', true),
  ('Beach / waterfront day', null, 'beach', 'Outdoorsy & Nature', 14, 'Medium', 'Small group', 'Medium', 'Moderate', 'Outdoor', '$', 'Full day', true),
  ('Catch a live show', null, 'show', 'Cultural & Intellectual', 15, 'High', 'Crowd', 'Low', 'Moderate', 'Either', '$$$', 'Full event', true),
  ('Visit a museum', null, 'museum', 'Cultural & Intellectual', 16, 'Low', '1:1 / Small', 'Low', 'Moderate', 'Indoor', '$$', 'Half-day', true),
  ('Bookstore browse', null, 'bookstore', 'Cultural & Intellectual', 17, 'Low', '1:1 / Small', 'Low', 'Routine', 'Indoor', '$', 'Quick-1h', true),
  ('See theater / comedy', null, 'theater_comedy', 'Cultural & Intellectual', 18, 'Medium', 'Crowd', 'Low', 'Moderate', 'Indoor', '$$$', 'Full event', true),
  ('Cook a meal together', null, 'cooking', 'Creative & Hands-On', 19, 'Medium', '1:1 / Small', 'Medium', 'Moderate', 'Indoor', '$', 'Half-event', true),
  ('Take an art / pottery class', null, 'pottery_class', 'Creative & Hands-On', 20, 'Medium', 'Small group', 'Medium', 'Novel', 'Indoor', '$$', 'Half-event', true),
  ('Go thrifting', null, 'thrift', 'Creative & Hands-On', 21, 'Low', '1:1 / Small', 'Low', 'Moderate', 'Indoor', '$', 'Half-day', true),
  ('Go bowling', null, 'bowling', 'Playful & Competitive', 22, 'Medium', 'Small group', 'Medium', 'Moderate', 'Indoor', '$$', 'Half-event', true),
  ('Game night', null, 'game_night', 'Playful & Competitive', 23, 'Medium', 'Small group', 'Low', 'Moderate', 'Indoor', '$', 'Half-event', true),
  ('Arcade / mini-golf', null, 'arcade_mini_golf', 'Playful & Competitive', 24, 'Medium', 'Small group', 'Medium', 'Moderate', 'Either', '$$', 'Half-event', true),
  ('Ice cream run', null, 'ice_cream', 'Indulgent & Sensory', 25, 'Low', '1:1 / Small', 'Low', 'Routine', 'Either', '$', 'Quick (<1h)', true),
  ('Try a new restaurant', null, 'restaurant', 'Indulgent & Sensory', 26, 'Medium', 'Small group', 'Low', 'Novel', 'Indoor', '$$', 'Half-event', true),
  ('Spa / self-care day', null, 'self_care', 'Indulgent & Sensory', 27, 'Low', '1:1', 'Low', 'Moderate', 'Indoor', '$$$', 'Half-day', true),
  ('Day trip / road trip', null, 'day_trip', 'Adventurous & Novel', 28, 'Medium', 'Small group', 'Medium', 'Novel', 'Outdoor', '$$', 'Full day', true),
  ('Escape room', null, 'escape_room', 'Adventurous & Novel', 29, 'High', 'Small group', 'Low', 'Novel', 'Indoor', '$$', '1h', true),
  ('Festival / street fair', null, 'festival', 'Adventurous & Novel', 30, 'High', 'Crowd', 'Medium', 'Novel', 'Outdoor', '$$', 'Full day', true)
on conflict (activity_key) do update set
  label = excluded.label,
  emoji = excluded.emoji,
  category = excluded.category,
  quiz_order = excluded.quiz_order,
  energy = excluded.energy,
  social_setting = excluded.social_setting,
  physical_exertion = excluded.physical_exertion,
  novelty = excluded.novelty,
  setting = excluded.setting,
  typical_cost = excluded.typical_cost,
  time_needed = excluded.time_needed,
  is_active = excluded.is_active;

update public.preference_options
set is_active = false,
    quiz_order = null
where activity_key not in (
  'coffee',
  'pizza',
  'movie',
  'drinks',
  'house_party',
  'dancing',
  'workout',
  'bike',
  'pickup_sport',
  'rock_climbing',
  'hike',
  'park',
  'sunset_walk',
  'beach',
  'show',
  'museum',
  'bookstore',
  'theater_comedy',
  'cooking',
  'pottery_class',
  'thrift',
  'bowling',
  'game_night',
  'arcade_mini_golf',
  'ice_cream',
  'restaurant',
  'self_care',
  'day_trip',
  'escape_room',
  'festival'
);

create unique index if not exists preference_options_active_quiz_order_idx
  on public.preference_options (quiz_order)
  where is_active = true;
