-- ggv-app news_posts table
--
-- One row per news post (e.g. a Boris Cherny tweet) translated by the routine.
-- `source` is unique so the routine can re-run without producing duplicates.

create extension if not exists pgcrypto;

create table if not exists public.news_posts (
  id            uuid primary key default gen_random_uuid(),
  source        text not null unique,
  author        text,
  original_text text not null,
  translation   text not null,
  posted_at     timestamptz not null,
  saved_at      timestamptz not null default now()
);

create index if not exists news_posts_posted_at_idx
  on public.news_posts (posted_at desc);

-- Read access: anonymous reads are fine for v1 since the data is non-sensitive
-- (publicly-posted tweets translated for the user's own feed). Tighten when
-- needed by adding a custom JWT and revoking anon select.
alter table public.news_posts enable row level security;

drop policy if exists "Allow anon read" on public.news_posts;
create policy "Allow anon read"
  on public.news_posts
  for select
  to anon
  using (true);

-- Writes go through the Next.js server with the service role key, which
-- bypasses RLS — no policy needed for inserts/updates from anon.
