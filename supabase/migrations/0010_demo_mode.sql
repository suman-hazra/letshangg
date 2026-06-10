-- v10: demo mode — persona accounts and timed demo swipe-backs.
--
-- is_demo marks the seeded persona profiles (created lazily by lib/demo.ts).
-- swipe_a_at / swipe_b_at record when each side swiped, so a persona can
-- "respond" a believable beat after the user swipes right, not instantly.

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

alter table public.hangs
  add column if not exists swipe_a_at timestamptz,
  add column if not exists swipe_b_at timestamptz;
