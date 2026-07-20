export type MatchStatus =
  | 'idle'
  | 'waiting'
  | 'active'
  | 'end_pending'
  | 'completed'
  | 'expired';

export type PlayerSide = 'mine' | 'opponent';
export type MatchBackend = 'demo' | 'supabase';
export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'error';

export interface Player {
  id: string;
  nickname: string;
}

export interface SushiItem {
  id: string;
  name: string;
  mine: number;
  opponent: number;
  createdAt: number;
}

export interface MatchEvent {
  id: string;
  kind:
    | 'create_sushi'
    | 'increment'
    | 'decrement'
    | 'undo'
    | 'join'
    | 'request_end'
    | 'cancel_end'
    | 'complete';
  side: PlayerSide;
  sushiId?: string;
  sushiName?: string;
  delta?: number;
  createdAt: number;
  description: string;
}

export interface MatchState {
  id: string | null;
  roomCode: string | null;
  title: '今天谁是寿司王';
  status: MatchStatus;
  backend: MatchBackend;
  currentUserId: string | null;
  endRequestedBy: string | null;
  mine: Player | null;
  opponent: Player | null;
  sushi: SushiItem[];
  events: MatchEvent[];
  startedAt: number | null;
  endedAt: number | null;
}

export interface MatchHistory {
  id: string;
  mine: string;
  opponent: string;
  mineScore: number;
  opponentScore: number;
  sushiCount: number;
  startedAt: number;
  endedAt: number;
  winner: PlayerSide | 'tie';
}

export interface UndoEntry {
  eventId: string;
  sushiId: string;
  sushiName: string;
  side: PlayerSide;
}
