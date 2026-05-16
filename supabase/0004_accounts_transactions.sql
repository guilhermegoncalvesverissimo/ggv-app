-- Wallet: accounts + transactions.
--
-- NOTE: prefixed `ggv_` because this Supabase project is SHARED with the
-- av-group-app, which already owns plain `public.accounts` /
-- `public.transactions`. Without the prefix, `create table if not exists`
-- silently skips creation and later index DDL fails on the wrong table.
--
-- Money is integer cents (amount_cents >= 0); sign derived from `type`.
-- Deleting an account cascades its transactions.

create extension if not exists pgcrypto;

create table if not exists public.ggv_accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null,
  emoji       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.ggv_transactions (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.ggv_accounts(id) on delete cascade,
  type          text not null check (type in ('income', 'expense')),
  amount_cents  integer not null check (amount_cents >= 0),
  category      text not null,
  note          text,
  date          date not null,
  created_at    timestamptz not null default now()
);

create index if not exists ggv_transactions_account_id_idx
  on public.ggv_transactions (account_id);
create index if not exists ggv_transactions_date_idx
  on public.ggv_transactions (date desc);

alter table public.ggv_accounts     enable row level security;
alter table public.ggv_transactions enable row level security;

-- No policies = no anon access. The Next.js proxy enforces the session
-- cookie; the server uses the service role key which bypasses RLS.
