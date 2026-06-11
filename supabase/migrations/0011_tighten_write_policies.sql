-- v11: tighten write policies that previously trusted the app layer.
--
-- Two RLS holes let an authenticated user bypass the server actions by calling
-- PostgREST directly with the public anon key + their own JWT:
--
--   1. hangs: the UPDATE policy only checked party membership, not which
--      columns changed. A party could set the OTHER user's swipe, flip
--      `matched` to forge a match (unlocking chat), or inject `event_url` /
--      `event_title` / `prompt_copy` that the friend then sees on /home.
--
--   2. friendships: the INSERT policy didn't constrain `status`, so a user
--      could insert a row with status='accepted' and force an un-consented
--      friendship (and then DM the victim via friendship_messages).
--
-- Fix: clients no longer write hangs at all — swipe/seen writes go through
-- server actions using the service-role client, which authorize the caller and
-- set only that caller's columns. And the friendships INSERT is pinned to
-- status='pending'. Legitimate accepted-friendship inserts (invite accept,
-- demo seeding) already run through the service-role client and bypass RLS.

-- ── hangs: remove client UPDATE access ──────────────────────────────────────
drop policy if exists "hangs_update_party" on public.hangs;
-- Belt-and-suspenders: even if a future policy is added by mistake, the role
-- has no column privileges to lean on.
revoke update on public.hangs from authenticated, anon;
-- SELECT stays governed by hangs_read_party; INSERT/UPDATE happen via
-- service_role (Hang Manager + swipe/seen server actions), which bypasses RLS.

-- ── friendships: pin client INSERTs to pending ──────────────────────────────
drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester" on public.friendships
  for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending');
