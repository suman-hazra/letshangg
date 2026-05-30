-- v2 fix: add missing INSERT and UPDATE policies on friendships.
-- v1 only had SELECT (writes went through make-friends.sql admin script).
-- v2 needs client-side sendFriendRequest + acceptFriendRequest to work.

-- The requester can create a pending friendship to anyone.
create policy "friendships_insert_requester" on public.friendships
  for insert to authenticated
  with check (auth.uid() = requester_id);

-- The addressee can update a friendship's status (accept / decline).
-- They can't change the requester/addressee fields themselves — only status.
create policy "friendships_update_addressee" on public.friendships
  for update to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- The addressee can also delete a pending friendship outright (decline).
create policy "friendships_delete_addressee" on public.friendships
  for delete to authenticated
  using (auth.uid() = addressee_id);
