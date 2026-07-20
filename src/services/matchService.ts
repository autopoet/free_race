import * as Crypto from 'expo-crypto';
import { RealtimeChannel } from '@supabase/supabase-js';

import { requireSupabase } from '@/lib/supabase';
import {
  ConnectionStatus,
  MatchEvent,
  MatchState,
  Player,
  PlayerSide,
  SushiItem,
} from '@/types/match';

interface MatchRow {
  id: string;
  room_code: string;
  title: string;
  status: 'waiting' | 'active' | 'end_pending' | 'completed' | 'expired';
  end_requested_by: string | null;
  started_at: string | null;
  ended_at: string | null;
}

interface PlayerRow {
  user_id: string;
  nickname: string;
  seat: 1 | 2;
  joined_at: string;
}

interface SushiRow {
  id: string;
  name: string;
  created_at: string;
}

interface EventRow {
  id: string;
  player_id: string;
  sushi_type_id: string | null;
  kind: MatchEvent['kind'];
  delta: -1 | 0 | 1;
  created_at: string;
}

interface RoomResult {
  match_id: string;
  room_code: string;
}

let sessionPromise: Promise<string> | null = null;

function messageFromError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return '网络开小差了，请稍后再试';
}

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw new Error(messageFromError(result.error));
  if (result.data === null) throw new Error('服务器没有返回有效数据');
  return result.data;
}

export async function ensureAnonymousSession() {
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    const client = requireSupabase();
    const sessionResult = await client.auth.getSession();
    if (sessionResult.error) throw new Error(messageFromError(sessionResult.error));
    if (sessionResult.data.session?.user.id) {
      await client.realtime.setAuth(
        sessionResult.data.session.access_token,
      );
      return sessionResult.data.session.user.id;
    }

    const signInResult = await client.auth.signInAnonymously();
    if (signInResult.error) {
      throw new Error(
        signInResult.error.message.includes('Anonymous sign-ins are disabled')
          ? 'Supabase 尚未开启匿名登录，请先在 Authentication 设置中启用'
          : messageFromError(signInResult.error),
      );
    }
    if (!signInResult.data.user?.id) throw new Error('匿名身份创建失败');
    if (signInResult.data.session?.access_token) {
      await client.realtime.setAuth(signInResult.data.session.access_token);
    }
    return signInResult.data.user.id;
  })().catch((error) => {
    sessionPromise = null;
    throw error;
  });

  return sessionPromise;
}

export async function createRemoteMatch(nickname: string) {
  const userId = await ensureAnonymousSession();
  const result = await requireSupabase().rpc('create_match', {
    p_nickname: nickname,
  });
  const rows = unwrap(result as { data: RoomResult[] | null; error: unknown });
  const room = rows[0];
  if (!room) throw new Error('房间创建失败，请稍后再试');
  return { matchId: room.match_id, roomCode: room.room_code, userId };
}

export async function joinRemoteMatch(code: string, nickname: string) {
  const userId = await ensureAnonymousSession();
  const result = await requireSupabase().rpc('join_match', {
    p_room_code: code,
    p_nickname: nickname,
  });
  const rows = unwrap(result as { data: RoomResult[] | null; error: unknown });
  const room = rows[0];
  if (!room) throw new Error('加入比赛失败，请稍后再试');
  return { matchId: room.match_id, roomCode: room.room_code, userId };
}

function sideFor(playerId: string, currentUserId: string): PlayerSide {
  return playerId === currentUserId ? 'mine' : 'opponent';
}

function describeEvent(
  row: EventRow,
  players: Map<string, Player>,
  sushi: Map<string, SushiItem>,
  currentUserId: string,
) {
  const side = sideFor(row.player_id, currentUserId);
  const nickname = side === 'mine' ? '你' : players.get(row.player_id)?.nickname ?? '对手';
  const sushiName = row.sushi_type_id
    ? sushi.get(row.sushi_type_id)?.name ?? '寿司'
    : undefined;

  switch (row.kind) {
    case 'join':
      return `${players.get(row.player_id)?.nickname ?? nickname} 加入了比赛`;
    case 'create_sushi':
      return `${nickname}新增了「${sushiName ?? '寿司'}」`;
    case 'increment':
      return `${nickname}吃了 1 个${sushiName ? ` ${sushiName}` : '寿司'}`;
    case 'decrement':
      return `${nickname}修正了 1 个${sushiName ? ` ${sushiName}` : '寿司'}`;
    case 'undo':
      return `${nickname}撤销了 1 个${sushiName ? ` ${sushiName}` : '寿司'}`;
    case 'request_end':
      return `${nickname}申请结束比赛`;
    case 'cancel_end':
      return `${nickname}选择继续比赛`;
    case 'complete':
      return '双方确认，比赛结束';
  }
}

export async function fetchRemoteMatch(
  matchId: string,
  knownUserId?: string | null,
): Promise<MatchState> {
  const client = requireSupabase();
  const sessionUserId = await ensureAnonymousSession();
  if (knownUserId && knownUserId !== sessionUserId) {
    throw new Error('这场比赛的匿名身份已失效，无法继续同步');
  }
  const currentUserId = knownUserId ?? sessionUserId;
  const [matchResult, playerResult, sushiResult, eventResult] = await Promise.all([
    client
      .from('matches')
      .select('id,room_code,title,status,end_requested_by,started_at,ended_at')
      .eq('id', matchId)
      .single(),
    client
      .from('match_players')
      .select('user_id,nickname,seat,joined_at')
      .eq('match_id', matchId)
      .order('seat'),
    client
      .from('sushi_types')
      .select('id,name,created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false }),
    client
      .from('match_events')
      .select('id,player_id,sushi_type_id,kind,delta,created_at')
      .eq('match_id', matchId)
      .order('created_at'),
  ]);

  const match = unwrap(matchResult as { data: MatchRow | null; error: unknown });
  const playerRows = unwrap(
    playerResult as { data: PlayerRow[] | null; error: unknown },
  );
  const sushiRows = unwrap(
    sushiResult as { data: SushiRow[] | null; error: unknown },
  );
  const eventRows = unwrap(
    eventResult as { data: EventRow[] | null; error: unknown },
  );

  const players = new Map<string, Player>(
    playerRows.map((row) => [
      row.user_id,
      { id: row.user_id, nickname: row.nickname },
    ]),
  );
  const mine = players.get(currentUserId) ?? null;
  const opponent =
    playerRows
      .filter((row) => row.user_id !== currentUserId)
      .map((row) => players.get(row.user_id) ?? null)[0] ?? null;

  const sushiById = new Map<string, SushiItem>(
    sushiRows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        mine: 0,
        opponent: 0,
        createdAt: new Date(row.created_at).getTime(),
      },
    ]),
  );

  for (const row of eventRows) {
    if (!row.sushi_type_id || row.delta === 0) continue;
    const item = sushiById.get(row.sushi_type_id);
    if (!item) continue;
    const side = sideFor(row.player_id, currentUserId);
    item[side] = Math.max(0, item[side] + row.delta);
  }

  const events = eventRows.map<MatchEvent>((row) => {
    const side = sideFor(row.player_id, currentUserId);
    const item = row.sushi_type_id ? sushiById.get(row.sushi_type_id) : undefined;
    return {
      id: row.id,
      kind: row.kind,
      side,
      sushiId: row.sushi_type_id ?? undefined,
      sushiName: item?.name,
      delta: row.delta || undefined,
      createdAt: new Date(row.created_at).getTime(),
      description: describeEvent(row, players, sushiById, currentUserId),
    };
  });

  return {
    id: match.id,
    roomCode: match.room_code,
    title: '今天谁是寿司王',
    status: match.status,
    backend: 'supabase',
    currentUserId,
    endRequestedBy: match.end_requested_by,
    mine,
    opponent,
    sushi: [...sushiById.values()],
    events,
    startedAt: match.started_at ? new Date(match.started_at).getTime() : null,
    endedAt: match.ended_at ? new Date(match.ended_at).getTime() : null,
  };
}

export async function createRemoteSushi(matchId: string, name: string) {
  const sushiId = Crypto.randomUUID();
  const result = await requireSupabase().rpc('create_sushi', {
    p_match_id: matchId,
    p_sushi_id: sushiId,
    p_name: name,
  });
  unwrap(result as { data: string | null; error: unknown });
  return sushiId;
}

export async function appendRemoteCount(
  matchId: string,
  sushiId: string,
  delta: -1 | 1,
  kind: 'increment' | 'decrement' | 'undo',
  eventId = Crypto.randomUUID(),
) {
  const result = await requireSupabase().rpc('append_count_event', {
    p_event_id: eventId,
    p_match_id: matchId,
    p_sushi_id: sushiId,
    p_delta: delta,
    p_kind: kind,
  });
  unwrap(result as { data: string | null; error: unknown });
  return eventId;
}

export async function requestRemoteEnd(matchId: string) {
  const result = await requireSupabase().rpc('request_match_end', {
    p_match_id: matchId,
  });
  if (result.error) throw new Error(messageFromError(result.error));
}

export async function cancelRemoteEnd(matchId: string) {
  const result = await requireSupabase().rpc('cancel_match_end', {
    p_match_id: matchId,
  });
  if (result.error) throw new Error(messageFromError(result.error));
}

export async function confirmRemoteEnd(matchId: string) {
  const result = await requireSupabase().rpc('confirm_match_end', {
    p_match_id: matchId,
  });
  if (result.error) throw new Error(messageFromError(result.error));
}

export function subscribeToRemoteMatch(
  matchId: string,
  onChange: () => void,
  onStatus: (status: ConnectionStatus) => void,
) {
  const client = requireSupabase();
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(onChange, 80);
  };

  const channel: RealtimeChannel = client
    .channel(`match:${matchId}:${Crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      scheduleRefresh,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_players',
        filter: `match_id=eq.${matchId}`,
      },
      scheduleRefresh,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sushi_types',
        filter: `match_id=eq.${matchId}`,
      },
      scheduleRefresh,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_events',
        filter: `match_id=eq.${matchId}`,
      },
      scheduleRefresh,
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus('connected');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onStatus('error');
      else if (status === 'CLOSED') onStatus('offline');
      else onStatus('connecting');
    });

  return () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    void client.removeChannel(channel);
  };
}
