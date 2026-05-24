-- CashHunters: distinguish 'campaign' (one-shot cashback / promo) from
-- 'card' (a recurring credit-card flow scheme). One table, one schema —
-- the kind column just lets the UI split the list into two sections.

alter table public.ggv_cashhunters
  add column if not exists kind text not null default 'campaign'
  check (kind in ('campaign', 'card'));

create index if not exists ggv_cashhunters_kind_idx
  on public.ggv_cashhunters (kind);
