-- Eventos da Wallet: agrupar despesas (ex.: "Fim de semana no Porto") para
-- saber quanto custou. Uma transação pertence a um evento no máximo.

create extension if not exists pgcrypto;

create table if not exists public.ggv_wallet_events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text,
  color       text not null,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now()
);

alter table public.ggv_transactions
  add column if not exists event_id uuid
  references public.ggv_wallet_events(id) on delete set null;

create index if not exists ggv_transactions_event_id_idx
  on public.ggv_transactions (event_id);

alter table public.ggv_wallet_events enable row level security;
-- No policies = service-role-only (the Next.js proxy enforces auth first).
