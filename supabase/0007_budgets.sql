-- Monthly budgets per category (recurring — one amount applies to every
-- month; the spent % is computed against the month you're viewing).
-- One row per category; `category` is the built-in id string or a custom
-- category UUID. Prefixed `ggv_` for the shared Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.ggv_budgets (
  id            uuid primary key default gen_random_uuid(),
  category      text not null unique,
  amount_cents  integer not null check (amount_cents >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.ggv_budgets enable row level security;
-- No policies = service-role-only (the Next.js proxy enforces auth first).
