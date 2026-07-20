begin;

create extension if not exists pgcrypto with schema extensions;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  title text not null default '今天谁是寿司王',
  status text not null default 'waiting',
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  end_requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  started_at timestamptz,
  ended_at timestamptz,
  constraint matches_room_code_format check (room_code ~ '^[A-F0-9]{10}$'),
  constraint matches_title_fixed check (title = '今天谁是寿司王'),
  constraint matches_status_valid check (
    status in ('waiting', 'active', 'end_pending', 'completed', 'expired')
  )
);

create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  seat smallint not null,
  joined_at timestamptz not null default now(),
  primary key (match_id, user_id),
  unique (match_id, seat),
  constraint match_players_nickname_length check (
    char_length(btrim(nickname)) between 1 and 12
  ),
  constraint match_players_seat_valid check (seat in (1, 2))
);

create table public.sushi_types (
  id uuid primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint sushi_types_name_length check (
    char_length(btrim(name)) between 1 and 30
  ),
  unique (match_id, normalized_name)
);

create table public.match_events (
  id uuid primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null,
  sushi_type_id uuid references public.sushi_types(id) on delete cascade,
  kind text not null,
  delta smallint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (match_id, player_id)
    references public.match_players(match_id, user_id)
    on delete cascade,
  constraint match_events_kind_valid check (
    kind in (
      'join',
      'create_sushi',
      'increment',
      'decrement',
      'undo',
      'request_end',
      'cancel_end',
      'complete'
    )
  ),
  constraint match_events_delta_valid check (delta in (-1, 0, 1)),
  constraint match_events_count_shape check (
    (
      kind in ('increment', 'decrement', 'undo')
      and sushi_type_id is not null
      and delta in (-1, 1)
    )
    or
    (
      kind not in ('increment', 'decrement', 'undo')
      and delta = 0
    )
  )
);

create index match_players_user_id_idx
  on public.match_players(user_id, match_id);
create index sushi_types_match_created_idx
  on public.sushi_types(match_id, created_at);
create index match_events_match_created_idx
  on public.match_events(match_id, created_at);
create index match_events_score_idx
  on public.match_events(match_id, player_id, sushi_type_id)
  where delta <> 0;

alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.sushi_types enable row level security;
alter table public.match_events enable row level security;

create or replace function public.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.match_players
    where match_id = p_match_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_match_member(uuid) from public;
grant execute on function public.is_match_member(uuid) to authenticated;

create policy "members can read their matches"
on public.matches
for select
to authenticated
using (public.is_match_member(id));

create policy "members can read players"
on public.match_players
for select
to authenticated
using (public.is_match_member(match_id));

create policy "members can read sushi types"
on public.sushi_types
for select
to authenticated
using (public.is_match_member(match_id));

create policy "members can read match events"
on public.match_events
for select
to authenticated
using (public.is_match_member(match_id));

revoke all on table public.matches from anon, authenticated;
revoke all on table public.match_players from anon, authenticated;
revoke all on table public.sushi_types from anon, authenticated;
revoke all on table public.match_events from anon, authenticated;
grant select on table public.matches to authenticated;
grant select on table public.match_players to authenticated;
grant select on table public.sushi_types to authenticated;
grant select on table public.match_events to authenticated;

create or replace function public.create_match(p_nickname text)
returns table(match_id uuid, room_code text)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := coalesce(btrim(p_nickname), '');
  v_match_id uuid;
  v_room_code text;
  v_attempt smallint := 0;
begin
  if v_user_id is null then
    raise exception '请先建立匿名身份';
  end if;
  if char_length(v_nickname) not between 1 and 12 then
    raise exception '昵称需为 1 到 12 个字';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_room_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
    begin
      insert into public.matches (room_code, creator_user_id)
      values (v_room_code, v_user_id)
      returning id into v_match_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception '房间创建失败，请稍后重试';
      end if;
    end;
  end loop;

  insert into public.match_players (match_id, user_id, nickname, seat)
  values (v_match_id, v_user_id, v_nickname, 1);

  insert into public.match_events (id, match_id, player_id, kind)
  values (gen_random_uuid(), v_match_id, v_user_id, 'join');

  return query select v_match_id, v_room_code;
end;
$$;

create or replace function public.join_match(p_room_code text, p_nickname text)
returns table(match_id uuid, room_code text)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_nickname text := coalesce(btrim(p_nickname), '');
  v_code text := upper(coalesce(btrim(p_room_code), ''));
  v_match public.matches%rowtype;
begin
  if v_user_id is null then
    raise exception '请先建立匿名身份';
  end if;
  if v_code !~ '^[A-F0-9]{10}$' then
    raise exception '二维码中的房间码无效';
  end if;
  if char_length(v_nickname) not between 1 and 12 then
    raise exception '昵称需为 1 到 12 个字';
  end if;

  select *
  into v_match
  from public.matches
  where matches.room_code = v_code
  for update;

  if not found then
    raise exception '没有找到这场比赛';
  end if;
  if v_match.expires_at <= now() then
    raise exception '这个房间已经过期';
  end if;
  if v_match.status <> 'waiting' then
    raise exception '这场比赛已经开始或结束';
  end if;
  if v_match.creator_user_id = v_user_id then
    raise exception '请用另一台手机扫码加入';
  end if;
  if exists (
    select 1
    from public.match_players as players
    where players.match_id = v_match.id
      and players.seat = 2
  ) then
    raise exception '这个房间已经满员';
  end if;

  insert into public.match_players (match_id, user_id, nickname, seat)
  values (v_match.id, v_user_id, v_nickname, 2);

  update public.matches
  set status = 'active',
      started_at = now()
  where id = v_match.id;

  insert into public.match_events (id, match_id, player_id, kind)
  values (gen_random_uuid(), v_match.id, v_user_id, 'join');

  return query select v_match.id, v_match.room_code;
end;
$$;

create or replace function public.create_sushi(
  p_match_id uuid,
  p_sushi_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := coalesce(btrim(p_name), '');
  v_status text;
begin
  if v_user_id is null or not public.is_match_member(p_match_id) then
    raise exception '你不是这场比赛的成员';
  end if;
  if char_length(v_name) not between 1 and 30 then
    raise exception '寿司名称需为 1 到 30 个字';
  end if;

  select status into v_status
  from public.matches
  where id = p_match_id
  for update;

  if v_status <> 'active' then
    raise exception '当前不能修改共享菜单';
  end if;

  begin
    insert into public.sushi_types (id, match_id, name, created_by)
    values (p_sushi_id, p_match_id, v_name, v_user_id);
  exception when unique_violation then
    raise exception '共享菜单里已经有这个寿司了';
  end;

  insert into public.match_events (
    id, match_id, player_id, sushi_type_id, kind
  )
  values (
    gen_random_uuid(), p_match_id, v_user_id, p_sushi_id, 'create_sushi'
  );

  return p_sushi_id;
end;
$$;

create or replace function public.append_count_event(
  p_event_id uuid,
  p_match_id uuid,
  p_sushi_id uuid,
  p_delta smallint,
  p_kind text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_current_count integer;
  v_existing public.match_events%rowtype;
begin
  if v_user_id is null or not public.is_match_member(p_match_id) then
    raise exception '你不是这场比赛的成员';
  end if;
  if p_delta not in (-1, 1) then
    raise exception '计数变化只能是 1 或 -1';
  end if;
  if (p_delta = 1 and p_kind <> 'increment')
    or (p_delta = -1 and p_kind not in ('decrement', 'undo')) then
    raise exception '计数事件类型无效';
  end if;

  select *
  into v_existing
  from public.match_events
  where id = p_event_id;

  if found then
    if v_existing.match_id = p_match_id
      and v_existing.player_id = v_user_id
      and v_existing.sushi_type_id = p_sushi_id
      and v_existing.delta = p_delta
      and v_existing.kind = p_kind then
      return p_event_id;
    end if;
    raise exception '事件编号已经被使用';
  end if;

  select status into v_status
  from public.matches
  where id = p_match_id
  for update;

  if v_status <> 'active' then
    raise exception '比赛当前不能计数';
  end if;
  if not exists (
    select 1 from public.sushi_types
    where id = p_sushi_id and match_id = p_match_id
  ) then
    raise exception '共享菜单中没有这个寿司';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_sushi_id::text, 0)
  );

  if p_delta = -1 then
    select coalesce(sum(delta), 0)
    into v_current_count
    from public.match_events
    where match_id = p_match_id
      and player_id = v_user_id
      and sushi_type_id = p_sushi_id;

    if v_current_count <= 0 then
      raise exception '这个寿司的计数已经是 0';
    end if;
  end if;

  insert into public.match_events (
    id, match_id, player_id, sushi_type_id, kind, delta
  )
  values (
    p_event_id, p_match_id, v_user_id, p_sushi_id, p_kind, p_delta
  );

  return p_event_id;
end;
$$;

create or replace function public.request_match_end(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null or not public.is_match_member(p_match_id) then
    raise exception '你不是这场比赛的成员';
  end if;

  select status into v_status
  from public.matches
  where id = p_match_id
  for update;

  if v_status <> 'active' then
    raise exception '当前不能申请结束比赛';
  end if;

  update public.matches
  set status = 'end_pending',
      end_requested_by = v_user_id
  where id = p_match_id;

  insert into public.match_events (id, match_id, player_id, kind)
  values (gen_random_uuid(), p_match_id, v_user_id, 'request_end');
end;
$$;

create or replace function public.cancel_match_end(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null or not public.is_match_member(p_match_id) then
    raise exception '你不是这场比赛的成员';
  end if;

  select status into v_status
  from public.matches
  where id = p_match_id
  for update;

  if v_status <> 'end_pending' then
    raise exception '当前没有待确认的结束申请';
  end if;

  update public.matches
  set status = 'active',
      end_requested_by = null
  where id = p_match_id;

  insert into public.match_events (id, match_id, player_id, kind)
  values (gen_random_uuid(), p_match_id, v_user_id, 'cancel_end');
end;
$$;

create or replace function public.confirm_match_end(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.matches%rowtype;
begin
  if v_user_id is null or not public.is_match_member(p_match_id) then
    raise exception '你不是这场比赛的成员';
  end if;

  select *
  into v_match
  from public.matches
  where id = p_match_id
  for update;

  if v_match.status <> 'end_pending' then
    raise exception '当前没有待确认的结束申请';
  end if;
  if v_match.end_requested_by = v_user_id then
    raise exception '需要由另一位玩家确认结束';
  end if;

  update public.matches
  set status = 'completed',
      ended_at = now()
  where id = p_match_id;

  insert into public.match_events (id, match_id, player_id, kind)
  values (gen_random_uuid(), p_match_id, v_user_id, 'complete');
end;
$$;

revoke all on function public.create_match(text) from public, anon;
revoke all on function public.join_match(text, text) from public, anon;
revoke all on function public.create_sushi(uuid, uuid, text) from public, anon;
revoke all on function public.append_count_event(uuid, uuid, uuid, smallint, text) from public, anon;
revoke all on function public.request_match_end(uuid) from public, anon;
revoke all on function public.cancel_match_end(uuid) from public, anon;
revoke all on function public.confirm_match_end(uuid) from public, anon;

grant execute on function public.create_match(text) to authenticated;
grant execute on function public.join_match(text, text) to authenticated;
grant execute on function public.create_sushi(uuid, uuid, text) to authenticated;
grant execute on function public.append_count_event(uuid, uuid, uuid, smallint, text) to authenticated;
grant execute on function public.request_match_end(uuid) to authenticated;
grant execute on function public.cancel_match_end(uuid) to authenticated;
grant execute on function public.confirm_match_end(uuid) to authenticated;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.matches;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.match_players;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.sushi_types;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.match_events;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;

commit;
