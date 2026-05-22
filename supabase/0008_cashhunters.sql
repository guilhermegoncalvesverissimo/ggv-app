-- CashHunters: campanhas de cashback / promoções para fazer.
-- Steps stored as JSONB array of { id, label, done } — small/bounded so a
-- separate join table would be overkill. Prefixed `ggv_` (shared Supabase).

create extension if not exists pgcrypto;

create table if not exists public.ggv_cashhunters (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  url           text,
  target_cents  integer not null default 0 check (target_cents >= 0),
  steps         jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ggv_cashhunters_updated_at_idx
  on public.ggv_cashhunters (updated_at desc);

alter table public.ggv_cashhunters enable row level security;
-- No policies = service-role-only.
