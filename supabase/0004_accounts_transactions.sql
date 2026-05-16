-- Wallet: accounts + transactions.
--
-- Money is stored as integer cents (amount_cents) — no floats, ever.
-- Sign is derived from `type` (income/expense), amount_cents is always >= 0.
-- Deleting an account cascades its transactions.

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null,
  emoji       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.accounts(id) on delete cascade,
  type          text not null check (type in ('income', 'expense')),
  amount_cents  integer not null check (amount_cents >= 0),
  category      text not null,
  note          text,
  date          date not null,
  created_at    timestamptz not null default now()
);

create index if not exists transactions_account_id_idx
  on public.transactions (account_id);
create index if not exists transactions_date_idx
  on public.transactions (date desc);

alter table public.accounts     enable row level security;
alter table public.transactions enable row level security;

-- No policies = no anon access. The Next.js proxy enforces the session
-- cookie; the server uses the service role key which bypasses RLS.
