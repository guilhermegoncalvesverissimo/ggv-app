-- Personal "chat with yourself" — notes/messages stream for the Chat tab.
-- Single-user, so no author column. Text is capped at 4000 chars (notes,
-- not essays). Index on created_at for fast pagination newest-first.

create extension if not exists pgcrypto;

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  text        text not null check (length(text) > 0 and length(text) <= 4000),
  created_at  timestamptz not null default now()
);

create index if not exists messages_created_at_idx
  on public.messages (created_at);

-- RLS on, no policies → service role only (Next.js proxy enforces the session).
alter table public.messages enable row level security;
