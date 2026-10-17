-- Corley's Island device sync (js/sync.js). One row per sync code holding the site save; the table is closed to
-- the public API and reached only through these three functions, so a code can't be listed or guessed from the table.
create table if not exists public.island_saves (
  code text primary key check (code ~ '^[2-9A-HJKMNP-Z]{8}$'),
  data text not null check (length(data) <= 8000000),
  t bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.island_saves enable row level security;
revoke all on public.island_saves from anon, authenticated;

-- when the save under a code last changed (ms), 0 if there is none
create or replace function public.island_peek(p_code text) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce((select t from public.island_saves where code = p_code), 0)
$$;

-- the save under a code
create or replace function public.island_get(p_code text) returns table(data text, t bigint)
language sql stable security definer set search_path = '' as $$
  select s.data, s.t from public.island_saves s where s.code = p_code
$$;

-- write a save. p_base is the time of the save this device last saw: 0 makes a new code, otherwise the write only
-- lands if nobody has saved since. Returns the new time, or -1 when another device got there first
create or replace function public.island_put(p_code text, p_data text, p_base bigint) returns bigint
language plpgsql security definer set search_path = '' as $$
declare now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint; nt bigint;
begin
  if p_base = 0 then
    insert into public.island_saves(code, data, t) values (p_code, p_data, now_ms)
      on conflict (code) do nothing returning t into nt;
  else
    update public.island_saves set data = p_data, t = greatest(now_ms, t + 1), updated_at = now()
      where code = p_code and t = p_base returning t into nt;
  end if;
  return coalesce(nt, -1);
end $$;

revoke all on function public.island_peek(text), public.island_get(text), public.island_put(text, text, bigint) from public;
grant execute on function public.island_peek(text), public.island_get(text), public.island_put(text, text, bigint) to anon, authenticated;
