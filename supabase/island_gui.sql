-- Corley's Island screen skin (js/gui.js): the live look of the game's screen (colours, fonts and per-element changes),
-- one row that every device loads when the game opens. The owner publishes it from the game's screen editor with the
-- owner key, or from the claude.ai screen editor through their own Supabase connector (gui_set, closed to the public
-- API). Each publish keeps the one it replaced in island_gui_hist, so a bad look can be rolled back.
-- The owner key's hash goes in island_gui_owner by hand (never in this file):
--   insert into public.island_gui_owner(id, key_hash) values (1, encode(sha256(convert_to('KEYWITHOUTDASHES','UTF8')),'hex'))
--     on conflict (id) do update set key_hash = excluded.key_hash;
create table if not exists public.island_gui (
  id text primary key check (id = 'live'),
  data text not null check (length(data) <= 500000),
  t bigint not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.island_gui_hist (
  n bigserial primary key,
  data text not null,
  t bigint not null,
  saved_at timestamptz not null default now()
);
create table if not exists public.island_gui_owner (
  id int primary key default 1 check (id = 1),
  key_hash text not null
);
alter table public.island_gui enable row level security;
alter table public.island_gui_hist enable row level security;
alter table public.island_gui_owner enable row level security;
revoke all on public.island_gui, public.island_gui_hist, public.island_gui_owner from anon, authenticated;

-- the live skin, none before the first publish
create or replace function public.gui_get() returns table(data text, t bigint)
language sql stable security definer set search_path = '' as $$
  select g.data, g.t from public.island_gui g where g.id = 'live'
$$;

-- publish a skin as the live one, keeping the one it replaces; returns its time (ms)
create or replace function public.gui_set(p_data text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  insert into public.island_gui_hist(data, t) select g.data, g.t from public.island_gui g where g.id = 'live';
  insert into public.island_gui(id, data, t) values ('live', p_data, now_ms)
    on conflict (id) do update set data = excluded.data, t = greatest(excluded.t, public.island_gui.t + 1), updated_at = now();
  return (select g.t from public.island_gui g where g.id = 'live');
end $$;

-- the game's publish: the owner key (any case, dashes optional) or -1
create or replace function public.gui_put(p_key text, p_data text) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.island_gui_owner o
      where o.key_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(p_key, ''), '[^0-9A-Za-z]', '', 'g')), 'UTF8')), 'hex')) then
    return -1;
  end if;
  return public.gui_set(p_data);
end $$;

revoke all on function public.gui_get(), public.gui_set(text), public.gui_put(text, text) from public, anon, authenticated;
grant execute on function public.gui_get(), public.gui_put(text, text) to anon, authenticated;
