-- Planeamento de viagens. Prefixed `ggv_` for the shared Supabase project.
-- O roteiro e a checklist vivem em jsonb dentro da viagem: são sempre lidos
-- e gravados em conjunto, por isso não justificam tabelas próprias.

create extension if not exists pgcrypto;

create table if not exists public.ggv_trips (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  destination  text,
  emoji        text,
  color        text not null,
  start_date   date,
  end_date     date,
  budget_cents bigint,
  notes        text,
  items        jsonb not null default '[]'::jsonb,
  checklist    jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists ggv_trips_start_date_idx
  on public.ggv_trips (start_date);

alter table public.ggv_trips enable row level security;
-- No policies = service-role-only (the Next.js proxy enforces auth first).
