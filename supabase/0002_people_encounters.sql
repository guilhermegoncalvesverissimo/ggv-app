-- People + encounters for the Networking tab.
--
-- One row per person. `avatar` stores a small JPEG data URL (<=50KB after
-- client-side compression). Cascading delete on encounters keeps cleanup
-- simple when a person is removed.

create extension if not exists pgcrypto;

create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  badge       text,
  avatar      text,
  created_at  timestamptz not null default now()
);

create table if not exists public.encounters (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.people(id) on delete cascade,
  at          timestamptz not null default now()
);

create index if not exists encounters_person_id_idx
  on public.encounters (person_id);
create index if not exists encounters_at_idx
  on public.encounters (at desc);

-- Writes go through the Next.js server with the service role key (bypasses
-- RLS). Reads also happen server-side. No anon access — the Next.js proxy
-- enforces the session cookie before any handler runs.
alter table public.people     enable row level security;
alter table public.encounters enable row level security;

-- No policies = no anon access. Service role bypasses RLS entirely.
