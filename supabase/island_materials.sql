-- Corley's Island: the owner's own textures (js/ownmat.js), added to the map editor's material library from the Paint
-- panel. Every device loads the list when the game opens and each picture when a map or block first uses it. The
-- owner publishes with the same owner key as the screen skin (public.island_gui_owner, supabase/island_gui.sql).
-- id is the material's id in the game (its place in MAT_LIST plus one, js/materials.js): 41 and up, given once and
-- kept for good, since maps and saves store it. 71 is the last while MAT_MAX is 72; raise both together.
-- data: {n: name, cat, ft: tile size in feet, sh: shine 0 to 1, c: mean colour [r,g,b] 0 to 1, th: thumbnail data URL}
-- img: the 512 px seamless tile as a JPEG data URL.
create table if not exists public.island_materials (
  id int primary key check (id between 41 and 71),
  data text not null check (length(data) <= 30000),
  img text not null check (length(img) <= 700000),
  t bigint not null,
  updated_at timestamptz not null default now()
);
alter table public.island_materials enable row level security;
revoke all on public.island_materials from anon, authenticated;

-- every own texture without its picture
create or replace function public.mat_list() returns table(id int, data text, t bigint)
language sql stable security definer set search_path = '' as $$
  select m.id, m.data, m.t from public.island_materials m order by m.id
$$;

-- one texture's picture
create or replace function public.mat_img(p_id int) returns text
language sql stable security definer set search_path = '' as $$
  select m.img from public.island_materials m where m.id = p_id
$$;

-- publish a texture with the owner key (any case, dashes optional): p_id null adds a new one (p_img needed) and takes
-- the next free id; otherwise it changes that one, keeping its picture when p_img is null. Returns the id, or -1 for
-- a wrong key, -2 when the library is full, -3 for a new texture without a picture, -4 for an id that isn't there
create or replace function public.mat_put(p_key text, p_id int, p_data text, p_img text) returns int
language plpgsql security definer set search_path = '' as $$
declare now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint; nid int;
begin
  if not exists (select 1 from public.island_gui_owner o
      where o.key_hash = encode(sha256(convert_to(upper(regexp_replace(coalesce(p_key, ''), '[^0-9A-Za-z]', '', 'g')), 'UTF8')), 'hex')) then
    return -1;
  end if;
  if p_id is null then
    if p_img is null then return -3; end if;
    lock table public.island_materials in exclusive mode;
    select coalesce(max(m.id), 40) + 1 into nid from public.island_materials m;
    if nid > 71 then return -2; end if;
    insert into public.island_materials(id, data, img, t) values (nid, p_data, p_img, now_ms);
    return nid;
  end if;
  update public.island_materials m set data = p_data, img = coalesce(p_img, m.img), t = greatest(now_ms, m.t + 1), updated_at = now()
    where m.id = p_id;
  if not found then return -4; end if;
  return p_id;
end $$;

revoke all on function public.mat_list(), public.mat_img(int), public.mat_put(text, int, text, text) from public, anon, authenticated;
grant execute on function public.mat_list(), public.mat_img(int), public.mat_put(text, int, text, text) to anon, authenticated;
