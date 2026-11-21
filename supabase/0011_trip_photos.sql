-- Fotos das viagens. Os ficheiros vão para um bucket privado do Storage
-- (servidos pela app, atrás do login); a lista fica em jsonb na viagem.

alter table public.ggv_trips
  add column if not exists photos jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('ggv-trips', 'ggv-trips', false)
on conflict (id) do nothing;
-- No storage policies = service-role-only, like the tables.
