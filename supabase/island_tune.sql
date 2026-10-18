-- Corley's Island tuning (js/tune.js): the live numbers the game plays by (speeds, rates, capacities, jump height,
-- regrowth, rain, drying), one row that every device loads when the game opens. The owner publishes it from the game's
-- screen editor (Tuning tab) with the same owner key as the screen skin (public.island_gui_owner, island_gui.sql), or
-- from the claude.ai screen editor through their own Supabase connector (tune_set, closed to the public API). Each
-- publish keeps the one it replaced in island_tune_hist, so a bad tuning can be rolled back.
-- Data: {"v":1,"set":{"key":value}} with only the changed values, in the code's units (metres, seconds, radians).
create table if not exists public.island_tune (
  id text primary key check (id = 'live'),
  data text not null check (length(data) <= 20000),
  t bigint not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.island_tune_hist (
  n bigserial primary key,
  data text not null,
  t bigint not null,
  saved_at timestamptz not null default now()
);
alter table public.island_tune enable row level security;
alter table public.island_tune_hist enable row level security;
revoke all on public.island_tune, public.island_tune_hist from anon, authenticated;

-- the live tuning, none before the first publish
create or replace function public.tune_get() returns table(data text, t bigint)
language sql stable security definer set search_path = '' as $$
  select g.data, g.t from public.island_tune g where g.id = 'live'
$$;

-- publish a tuning as the live one, keeping the one it replaces; returns its time (ms)
create or replace function public.tune_set(p_data text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if (p_data::jsonb) -> 'set' is null or jsonb_typeof((p_data::jsonb) -> 'set') <> 'object' then
    raise exception 'not a tuning';
  end if;
  insert into public.island_tune_hist(data, t) select g.data, g.t from public.island_tune g where g.id = 'live';
  insert into public.island_tune(id, data, t) values ('live', p_data, now_ms)
    on conflict (id) do update set data = excluded.data, t = greatest(excluded.t, public.island_tune.t + 1), updated_at = now();
  return (select g.t from public.island_tune g where g.id = 'live');
end $$;

-- the game's publish: the owner key (any case, dashes optional) or -1
create or replace function public.tune_put(p_key text, p_data text) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.island_gui_owner o
      where o.key_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(p_key, ''), '[^0-9A-Za-z]', '', 'g')), 'UTF8')), 'hex')) then
    return -1;
  end if;
  return public.tune_set(p_data);
end $$;

revoke all on function public.tune_get(), public.tune_set(text), public.tune_put(text, text) from public, anon, authenticated;
grant execute on function public.tune_get(), public.tune_put(text, text) to anon, authenticated;
