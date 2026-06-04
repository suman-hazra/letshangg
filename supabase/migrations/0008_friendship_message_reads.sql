-- v8: per-user read receipts for direct friend chat.

create table public.friendship_message_reads (
  friendship_id uuid not null references public.friendships(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (friendship_id, user_id)
);

create index idx_friendship_message_reads_user
  on public.friendship_message_reads (user_id, friendship_id);

alter table public.friendship_message_reads enable row level security;

create policy "friendship_message_reads_own_read" on public.friendship_message_reads
  for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.friendships f
      where f.id = friendship_message_reads.friendship_id
        and f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    )
  );

create policy "friendship_message_reads_own_insert" on public.friendship_message_reads
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.friendships f
      where f.id = friendship_message_reads.friendship_id
        and f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    )
  );

create policy "friendship_message_reads_own_update" on public.friendship_message_reads
  for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.friendships f
      where f.id = friendship_message_reads.friendship_id
        and f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.friendships f
      where f.id = friendship_message_reads.friendship_id
        and f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    )
  );
