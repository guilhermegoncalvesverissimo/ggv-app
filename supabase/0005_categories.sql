-- User-created wallet categories. Built-in categories live in code; this
-- table only holds the custom ones the user adds. `id` is a UUID and is
-- stored on transactions.category just like a built-in id string.
--
-- Prefixed `ggv_` for the same reason as accounts/transactions: this
-- Supabase project is shared with av-group-app.

create extension if not exists pgcrypto;

create table if not exists public.ggv_categories (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  emoji       text not null,
  type        text not null check (type in ('income', 'expense')),
  created_at  timestamptz not null default now()
);

alter table public.ggv_categories enable row level security;
-- No policies = service-role-only (the Next.js proxy enforces auth first).
