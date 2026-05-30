-- letshangg v1 initial schema
-- Run in Supabase SQL Editor or via supabase CLI: supabase db push

-- ============================================================
-- profiles: 1-to-1 with auth.users
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row when a new auth.users row is inserted.
-- This avoids a race where a user signs in but has no profile.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- preference_options: the curated activity catalog
-- ============================================================
create table public.preference_options (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  emoji        text,
  activity_key text unique not null,        -- maps to FALLBACK_POOL key in lib/copy.ts
  category     text
);

-- ============================================================
-- user_preferences: per-user yay/nay verdicts
-- ============================================================
create table public.user_preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  preference_id uuid not null references public.preference_options(id) on delete cascade,
  verdict       text not null check (verdict in ('yay', 'nay')),
  unique (user_id, preference_id)
);

-- ============================================================
-- friendships: directed acceptance state
-- ============================================================
create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- ============================================================
-- hangs: generated 1:1 hang suggestions
-- ============================================================
create table public.hangs (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references public.profiles(id) on delete cascade,
  user_b        uuid not null references public.profiles(id) on delete cascade,
  preference_id uuid not null references public.preference_options(id) on delete cascade,
  prompt_copy   text not null,
  swipe_a       text check (swipe_a in ('right', 'left')),
  swipe_b       text check (swipe_b in ('right', 'left')),
  matched       boolean not null default false,
  seen_a_at     timestamptz,
  seen_b_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_a, user_b, preference_id),    -- idempotency guard
  check (user_a <> user_b)
);

-- Index for the /home query (find pending hangs for a user)
create index idx_hangs_user_a_pending on public.hangs (user_a) where swipe_a is null;
create index idx_hangs_user_b_pending on public.hangs (user_b) where swipe_b is null;
-- Index for unseen-match auto-redirect
create index idx_hangs_user_a_unseen_match on public.hangs (user_a)
  where matched = true and seen_a_at is null;
create index idx_hangs_user_b_unseen_match on public.hangs (user_b)
  where matched = true and seen_b_at is null;

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.preference_options  enable row level security;
alter table public.user_preferences    enable row level security;
alter table public.friendships         enable row level security;
alter table public.hangs               enable row level security;

-- profiles: anyone authenticated can read; only owner can update
create policy "profiles_read_all" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- preference_options: anyone authenticated can read the catalog
create policy "preference_options_read_all" on public.preference_options
  for select to authenticated using (true);

-- user_preferences: read/write only by owner
create policy "user_preferences_own" on public.user_preferences
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- friendships: visible to either party; v1 has no client-side write path
-- (seeded via make-friends.sql admin script)
create policy "friendships_read_party" on public.friendships
  for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- hangs: visible only to the two parties
create policy "hangs_read_party" on public.hangs
  for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- Updates: swipe + seen_{a|b}_at by the corresponding user
-- We allow row-level UPDATE; the server action is responsible for setting only
-- the columns belonging to the current user.
create policy "hangs_update_party" on public.hangs
  for update to authenticated
  using (auth.uid() in (user_a, user_b));

-- Hang Manager INSERTs via service_role (bypasses RLS).
