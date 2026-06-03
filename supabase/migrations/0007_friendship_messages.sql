-- v7: direct friend chat, independent of matched hangs.

create table public.friendship_messages (
  id            uuid primary key default gen_random_uuid(),
  friendship_id uuid not null references public.friendships(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 2000),
  created_at    timestamptz not null default now()
);

create index idx_friendship_messages_friendship_created
  on public.friendship_messages (friendship_id, created_at);

alter table public.friendship_messages enable row level security;

create policy "friendship_messages_read_party" on public.friendship_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.id = friendship_messages.friendship_id
        and f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    )
  );

create policy "friendship_messages_insert_party" on public.friendship_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.friendships f
      where f.id = friendship_messages.friendship_id
        and f.status = 'accepted'
        and auth.uid() in (f.requester_id, f.addressee_id)
    )
  );

alter publication supabase_realtime add table public.friendship_messages;
