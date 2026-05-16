-- Projects portfolio. Prefixed `ggv_` for the shared Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.ggv_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  url         text,
  tags        text[] not null default '{}',
  status      text not null check (status in ('active', 'idea', 'paused', 'done')),
  emoji       text,
  color       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ggv_projects_updated_at_idx
  on public.ggv_projects (updated_at desc);

alter table public.ggv_projects enable row level security;
-- No policies = service-role-only (the Next.js proxy enforces auth first).
