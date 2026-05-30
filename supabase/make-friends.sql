-- letshangg v1 admin: wire the seeded friendship.
-- Run AFTER you and your friend have both signed in via Google OAuth at least once.
--
-- Steps:
-- 1) In the Supabase dashboard → Authentication → Users, find both signed-in users
--    and copy their UUIDs.
-- 2) Paste the UUIDs below.
-- 3) Run this file in the SQL editor.

insert into public.friendships (requester_id, addressee_id, status)
values (
  '<paste-your-auth-uuid>',
  '<paste-friend-auth-uuid>',
  'accepted'
)
on conflict (requester_id, addressee_id) do update set status = 'accepted';
