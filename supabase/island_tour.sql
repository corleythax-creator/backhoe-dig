-- Corley's Island tour test results board (js/tourtest.js). Every finished island tour test on the Vercel site sends its
-- summary here, so runs from the phone, the PC and the headset land in one table to compare. The table is closed to the
-- public API and reached only through these two functions; a run holds no save data, only the device's graphics card
-- name, its settings and the frame numbers.
create table if not exists public.island_tour_runs (
  id bigserial primary key,
  t timestamptz not null default now(),
  v int not null,
  device text not null check (length(device) <= 300),
  gfx text not null check (length(gfx) <= 40),
  kind text not null check (length(kind) <= 80),
  fps real,
  data jsonb not null check (length(data::text) <= 40000)
);
alter table public.island_tour_runs enable row level security;
revoke all on public.island_tour_runs from anon, authenticated;
create index if not exists island_tour_runs_t on public.island_tour_runs (t desc);

-- add a run; returns its id
create or replace function public.island_tour_put(p_v int, p_device text, p_gfx text, p_kind text, p_fps real, p_data jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare nid bigint;
begin
  insert into public.island_tour_runs(v, device, gfx, kind, fps, data)
    values (p_v, left(p_device, 300), left(p_gfx, 40), left(p_kind, 80), p_fps, p_data) returning id into nid;
  return nid;
end $$;

-- the latest runs (at most 50), newest first, without their full data: what the results panel lists to compare devices
create or replace function public.island_tour_list(p_n int) returns table(t timestamptz, v int, device text, gfx text, kind text, fps real, legs jsonb)
language sql stable security definer set search_path = '' as $$
  select r.t, r.v, r.device, r.gfx, r.kind, r.fps, r.data->'legs' from public.island_tour_runs r order by r.t desc limit least(greatest(p_n, 1), 50)
$$;

grant execute on function public.island_tour_put(int, text, text, text, real, jsonb) to anon;
grant execute on function public.island_tour_list(int) to anon;
