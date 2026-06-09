-- v9: optional event metadata for real-time, location-aware hang suggestions.

alter table public.hangs
  add column if not exists event_title text,
  add column if not exists event_url text,
  add column if not exists event_venue text,
  add column if not exists event_starts_at timestamptz,
  add column if not exists event_source text;
