-- v2: in-app chat after match

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  hang_id    uuid not null references public.hangs(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index idx_messages_hang_created on public.messages (hang_id, created_at);

alter table public.messages enable row level security;

-- Only the two parties of the matched hang can read or write messages.
create policy "messages_read_party" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.hangs h
      where h.id = messages.hang_id
        and h.matched = true
        and auth.uid() in (h.user_a, h.user_b)
    )
  );

create policy "messages_insert_party" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.hangs h
      where h.id = messages.hang_id
        and h.matched = true
        and auth.uid() in (h.user_a, h.user_b)
    )
  );

-- Realtime: publish INSERTs on this table.
-- Run this once in the Supabase SQL editor too if "Realtime" toggle isn't on.
alter publication supabase_realtime add table public.messages;
