import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  bindSupabaseAuthRefresh,
  isSupabaseConfigured,
} from '@/lib/supabase';
import {
  appendRemoteCount,
  cancelRemoteEnd,
  confirmRemoteEnd,
  createRemoteMatch,
  createRemoteSushi,
  fetchRemoteMatch,
  joinRemoteMatch,
  requestRemoteEnd,
  subscribeToRemoteMatch,
} from '@/services/matchService';
import {
  ConnectionStatus,
  MatchEvent,
  MatchHistory,
  MatchState,
  PlayerSide,
  SushiItem,
  UndoEntry,
} from '@/types/match';

const STORAGE_KEY = '@sushi-king/state-v2';
const HISTORY_KEY = '@sushi-king/history-v1';

const initialState: MatchState = {
  id: null,
  roomCode: null,
  title: '今天谁是寿司王',
  status: 'idle',
  backend: 'demo',
  currentUserId: null,
  endRequestedBy: null,
  mine: null,
  opponent: null,
  sushi: [],
  events: [],
  startedAt: null,
  endedAt: null,
};

const localId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const localRoomCode = () =>
  Array.from(
    { length: 6 },
    () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[
        Math.floor(Math.random() * 32)
      ],
  ).join('');

const score = (items: SushiItem[], side: PlayerSide) =>
  items.reduce((total, item) => total + item[side], 0);

interface ActionResult {
  ok: boolean;
  message?: string;
}

interface MatchContextValue {
  state: MatchState;
  history: MatchHistory[];
  hydrated: boolean;
  busy: boolean;
  connectionStatus: ConnectionStatus;
  lastError: string | null;
  lastUndo: UndoEntry | null;
  mineScore: number;
  opponentScore: number;
  supabaseConfigured: boolean;
  createMatch: (nickname: string) => Promise<ActionResult>;
  joinRoom: (nickname: string, code?: string) => Promise<ActionResult>;
  simulateOpponentJoin: (nickname?: string) => void;
  addSushi: (name: string) => Promise<ActionResult>;
  increment: (sushiId: string, side?: PlayerSide) => Promise<void>;
  decrement: (sushiId: string) => Promise<void>;
  undoLast: () => Promise<void>;
  clearUndo: () => void;
  clearError: () => void;
  requestEnd: () => Promise<ActionResult>;
  cancelEnd: () => Promise<ActionResult>;
  completeMatch: () => Promise<ActionResult>;
  resetMatch: () => void;
  clearHistory: () => void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

function localEvent(
  description: string,
  kind: MatchEvent['kind'],
  side: PlayerSide,
  extra: Partial<MatchEvent> = {},
): MatchEvent {
  return {
    id: localId('event'),
    kind,
    side,
    createdAt: Date.now(),
    description,
    ...extra,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return '网络开小差了，请稍后再试';
}

function historyFromState(current: MatchState): MatchHistory | null {
  if (
    !current.id ||
    !current.mine ||
    !current.opponent ||
    !current.startedAt ||
    !current.endedAt
  ) {
    return null;
  }
  const mineScore = score(current.sushi, 'mine');
  const opponentScore = score(current.sushi, 'opponent');
  return {
    id: current.id,
    mine: current.mine.nickname,
    opponent: current.opponent.nickname,
    mineScore,
    opponentScore,
    sushiCount: current.sushi.length,
    startedAt: current.startedAt,
    endedAt: current.endedAt,
    winner:
      mineScore === opponentScore
        ? 'tie'
        : mineScore > opponentScore
          ? 'mine'
          : 'opponent',
  };
}

function normalizeSavedState(saved: MatchState): MatchState {
  return {
    ...initialState,
    ...saved,
    backend: saved.backend ?? 'demo',
    currentUserId: saved.currentUserId ?? saved.mine?.id ?? null,
    endRequestedBy: saved.endRequestedBy ?? null,
  };
}

export function MatchProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<MatchState>(initialState);
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('offline');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastUndo, setLastUndo] = useState<UndoEntry | null>(null);

  const saveCompletedHistory = useCallback((completed: MatchState) => {
    const entry = historyFromState(completed);
    if (!entry) return;
    setHistory((items) => [
      entry,
      ...items.filter((item) => item.id !== entry.id),
    ]);
  }, []);

  const syncRemote = useCallback(
    async (matchId: string, currentUserId?: string | null) => {
      try {
        const next = await fetchRemoteMatch(matchId, currentUserId);
        setState(next);
        setLastError(null);
        if (next.status === 'completed') saveCompletedHistory(next);
        return next;
      } catch (error) {
        const message = errorMessage(error);
        setLastError(message);
        setConnectionStatus('error');
        throw error;
      }
    },
    [saveCompletedHistory],
  );

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
    ])
      .then(([savedState, savedHistory]) => {
        if (savedState) {
          setState(normalizeSavedState(JSON.parse(savedState) as MatchState));
        }
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory) as MatchHistory[]);
        }
      })
      .catch(() => {
        setLastError('本机记录读取失败，但仍可以开始新比赛');
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => bindSupabaseAuthRefresh(), []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(
      () => undefined,
    );
  }, [history, hydrated]);

  useEffect(() => {
    if (
      !hydrated ||
      !isSupabaseConfigured ||
      state.backend !== 'supabase' ||
      !state.id ||
      state.status === 'completed' ||
      state.status === 'expired'
    ) {
      if (state.backend !== 'supabase') setConnectionStatus('offline');
      return;
    }

    const matchId = state.id;
    const currentUserId = state.currentUserId;
    setConnectionStatus('connecting');
    void syncRemote(matchId, currentUserId).catch(() => undefined);

    return subscribeToRemoteMatch(
      matchId,
      () => {
        void syncRemote(matchId, currentUserId).catch(() => undefined);
      },
      setConnectionStatus,
    );
  }, [
    hydrated,
    state.backend,
    state.currentUserId,
    state.id,
    state.status,
    syncRemote,
  ]);

  const createMatch = useCallback(
    async (nickname: string): Promise<ActionResult> => {
      const clean = nickname.trim();
      setLastUndo(null);
      setLastError(null);
      setBusy(true);

      try {
        if (!isSupabaseConfigured) {
          const playerId = localId('player');
          setState({
            ...initialState,
            id: localId('match'),
            roomCode: localRoomCode(),
            status: 'waiting',
            backend: 'demo',
            currentUserId: playerId,
            mine: { id: playerId, nickname: clean },
          });
          return { ok: true };
        }

        setConnectionStatus('connecting');
        const room = await createRemoteMatch(clean);
        const provisional: MatchState = {
          ...initialState,
          id: room.matchId,
          roomCode: room.roomCode,
          status: 'waiting',
          backend: 'supabase',
          currentUserId: room.userId,
          mine: { id: room.userId, nickname: clean },
        };
        setState(provisional);
        await syncRemote(room.matchId, room.userId);
        return { ok: true };
      } catch (error) {
        const message = errorMessage(error);
        setLastError(message);
        return { ok: false, message };
      } finally {
        setBusy(false);
      }
    },
    [syncRemote],
  );

  const joinRoom = useCallback(
    async (nickname: string, code = 'DEMO88'): Promise<ActionResult> => {
      const clean = nickname.trim();
      const cleanCode = code.trim().toUpperCase();
      setLastUndo(null);
      setLastError(null);
      setBusy(true);

      try {
        if (!isSupabaseConfigured || cleanCode === 'DEMO88') {
          const now = Date.now();
          const playerId = localId('player');
          setState({
            ...initialState,
            id: localId('match'),
            roomCode: cleanCode,
            status: 'active',
            backend: 'demo',
            currentUserId: playerId,
            mine: { id: playerId, nickname: clean },
            opponent: { id: localId('player'), nickname: '阿杰' },
            startedAt: now,
            events: [localEvent(`${clean} 加入了比赛`, 'join', 'mine')],
          });
          return { ok: true };
        }

        setConnectionStatus('connecting');
        const room = await joinRemoteMatch(cleanCode, clean);
        setState({
          ...initialState,
          id: room.matchId,
          roomCode: room.roomCode,
          status: 'active',
          backend: 'supabase',
          currentUserId: room.userId,
          mine: { id: room.userId, nickname: clean },
        });
        await syncRemote(room.matchId, room.userId);
        return { ok: true };
      } catch (error) {
        const message = errorMessage(error);
        setLastError(message);
        return { ok: false, message };
      } finally {
        setBusy(false);
      }
    },
    [syncRemote],
  );

  const simulateOpponentJoin = useCallback((nickname = '小美') => {
    setState((current) => {
      if (current.status !== 'waiting' || current.backend !== 'demo') {
        return current;
      }
      const now = Date.now();
      return {
        ...current,
        status: 'active',
        opponent: { id: localId('player'), nickname },
        startedAt: now,
        events: [
          ...current.events,
          localEvent(`${nickname} 加入了比赛`, 'join', 'opponent'),
        ],
      };
    });
  }, []);

  const addSushi = useCallback(
    async (rawName: string): Promise<ActionResult> => {
      const name = rawName.trim();
      if (!name) return { ok: false, message: '请填写寿司名称' };
      if (name.length > 30) {
        return { ok: false, message: '寿司名称不能超过 30 个字' };
      }
      if (
        state.sushi.some(
          (item) =>
            item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        )
      ) {
        return { ok: false, message: '共享菜单里已经有这个寿司了' };
      }
      if (!state.id || state.status !== 'active') {
        return { ok: false, message: '比赛当前不能添加寿司' };
      }

      setBusy(true);
      setLastError(null);
      try {
        if (state.backend === 'supabase') {
          await createRemoteSushi(state.id, name);
          await syncRemote(state.id, state.currentUserId);
        } else {
          setState((current) => {
            const item: SushiItem = {
              id: localId('sushi'),
              name,
              mine: 0,
              opponent: 0,
              createdAt: Date.now(),
            };
            return {
              ...current,
              sushi: [item, ...current.sushi],
              events: [
                ...current.events,
                localEvent(`新增了「${name}」`, 'create_sushi', 'mine', {
                  sushiId: item.id,
                  sushiName: name,
                }),
              ],
            };
          });
        }
        return { ok: true };
      } catch (error) {
        const message = errorMessage(error);
        setLastError(message);
        return { ok: false, message };
      } finally {
        setBusy(false);
      }
    },
    [
      state.backend,
      state.currentUserId,
      state.id,
      state.status,
      state.sushi,
      syncRemote,
    ],
  );

  const increment = useCallback(
    async (sushiId: string, side: PlayerSide = 'mine') => {
      const item = state.sushi.find((candidate) => candidate.id === sushiId);
      if (!item || state.status !== 'active') return;

      if (state.backend === 'supabase' && side === 'opponent') return;

      const eventId = Crypto.randomUUID();
      const nextEvent = localEvent(
        `${side === 'mine' ? '你' : state.opponent?.nickname ?? '对手'}吃了 1 个 ${item.name}`,
        'increment',
        side,
        {
          id: eventId,
          sushiId,
          sushiName: item.name,
          delta: 1,
        },
      );

      setState((current) => ({
        ...current,
        sushi: current.sushi.map((candidate) =>
          candidate.id === sushiId
            ? { ...candidate, [side]: candidate[side] + 1 }
            : candidate,
        ),
        events: [...current.events, nextEvent],
      }));

      if (side === 'mine') {
        setLastUndo({
          eventId,
          sushiId,
          sushiName: item.name,
          side,
        });
      }

      if (state.backend !== 'supabase' || side !== 'mine' || !state.id) return;

      try {
        await appendRemoteCount(
          state.id,
          sushiId,
          1,
          'increment',
          eventId,
        );
      } catch (error) {
        setLastError(errorMessage(error));
        setLastUndo(null);
        await syncRemote(state.id, state.currentUserId).catch(() => undefined);
      }
    },
    [
      state.backend,
      state.currentUserId,
      state.id,
      state.opponent?.nickname,
      state.status,
      state.sushi,
      syncRemote,
    ],
  );

  const decrement = useCallback(
    async (sushiId: string) => {
      const item = state.sushi.find((candidate) => candidate.id === sushiId);
      if (!item || item.mine <= 0 || state.status !== 'active') return;
      const eventId = Crypto.randomUUID();
      setLastUndo(null);
      setState((current) => ({
        ...current,
        sushi: current.sushi.map((candidate) =>
          candidate.id === sushiId
            ? { ...candidate, mine: Math.max(0, candidate.mine - 1) }
            : candidate,
        ),
        events: [
          ...current.events,
          localEvent(`修正了 1 个 ${item.name}`, 'decrement', 'mine', {
            id: eventId,
            sushiId,
            sushiName: item.name,
            delta: -1,
          }),
        ],
      }));

      if (state.backend !== 'supabase' || !state.id) return;
      try {
        await appendRemoteCount(
          state.id,
          sushiId,
          -1,
          'decrement',
          eventId,
        );
      } catch (error) {
        setLastError(errorMessage(error));
        await syncRemote(state.id, state.currentUserId).catch(() => undefined);
      }
    },
    [
      state.backend,
      state.currentUserId,
      state.id,
      state.status,
      state.sushi,
      syncRemote,
    ],
  );

  const undoLast = useCallback(async () => {
    const undo = lastUndo;
    if (!undo) return;
    const item = state.sushi.find((candidate) => candidate.id === undo.sushiId);
    if (!item || item.mine <= 0 || state.status !== 'active') {
      setLastUndo(null);
      return;
    }

    const eventId = Crypto.randomUUID();
    setLastUndo(null);
    setState((current) => ({
      ...current,
      sushi: current.sushi.map((candidate) =>
        candidate.id === undo.sushiId
          ? { ...candidate, mine: Math.max(0, candidate.mine - 1) }
          : candidate,
      ),
      events: [
        ...current.events,
        localEvent(`撤销了 1 个 ${undo.sushiName}`, 'undo', 'mine', {
          id: eventId,
          sushiId: undo.sushiId,
          sushiName: undo.sushiName,
          delta: -1,
        }),
      ],
    }));

    if (state.backend !== 'supabase' || !state.id) return;
    try {
      await appendRemoteCount(
        state.id,
        undo.sushiId,
        -1,
        'undo',
        eventId,
      );
    } catch (error) {
      setLastError(errorMessage(error));
      await syncRemote(state.id, state.currentUserId).catch(() => undefined);
    }
  }, [
    lastUndo,
    state.backend,
    state.currentUserId,
    state.id,
    state.status,
    state.sushi,
    syncRemote,
  ]);

  const requestEnd = useCallback(async (): Promise<ActionResult> => {
    if (!state.id || state.status !== 'active') {
      return { ok: false, message: '当前不能结束比赛' };
    }
    setLastError(null);
    if (state.backend === 'demo') {
      setState((current) => ({
        ...current,
        status: 'end_pending',
        endRequestedBy: current.currentUserId,
      }));
      return { ok: true };
    }

    setState((current) => ({
      ...current,
      status: 'end_pending',
      endRequestedBy: current.currentUserId,
    }));
    try {
      await requestRemoteEnd(state.id);
      return { ok: true };
    } catch (error) {
      const message = errorMessage(error);
      setLastError(message);
      await syncRemote(state.id, state.currentUserId).catch(() => undefined);
      return { ok: false, message };
    }
  }, [
    state.backend,
    state.currentUserId,
    state.id,
    state.status,
    syncRemote,
  ]);

  const cancelEnd = useCallback(async (): Promise<ActionResult> => {
    if (!state.id || state.status !== 'end_pending') {
      return { ok: false, message: '当前没有待确认的结束申请' };
    }
    if (state.backend === 'demo') {
      setState((current) => ({
        ...current,
        status: 'active',
        endRequestedBy: null,
      }));
      return { ok: true };
    }
    try {
      await cancelRemoteEnd(state.id);
      await syncRemote(state.id, state.currentUserId);
      return { ok: true };
    } catch (error) {
      const message = errorMessage(error);
      setLastError(message);
      return { ok: false, message };
    }
  }, [
    state.backend,
    state.currentUserId,
    state.id,
    state.status,
    syncRemote,
  ]);

  const completeMatch = useCallback(async (): Promise<ActionResult> => {
    if (
      !state.id ||
      !state.mine ||
      !state.opponent ||
      !state.startedAt ||
      state.status !== 'end_pending'
    ) {
      return { ok: false, message: '比赛还不能结算' };
    }

    if (state.backend === 'supabase') {
      try {
        await confirmRemoteEnd(state.id);
        const completed = await syncRemote(state.id, state.currentUserId);
        saveCompletedHistory(completed);
        setLastUndo(null);
        return { ok: true };
      } catch (error) {
        const message = errorMessage(error);
        setLastError(message);
        return { ok: false, message };
      }
    }

    const completed: MatchState = {
      ...state,
      status: 'completed',
      endedAt: Date.now(),
      events: [
        ...state.events,
        localEvent('比赛结束', 'complete', 'mine'),
      ],
    };
    setState(completed);
    saveCompletedHistory(completed);
    setLastUndo(null);
    return { ok: true };
  }, [saveCompletedHistory, state, syncRemote]);

  const resetMatch = useCallback(() => {
    setLastUndo(null);
    setLastError(null);
    setConnectionStatus('offline');
    setState(initialState);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const mineScore = useMemo(() => score(state.sushi, 'mine'), [state.sushi]);
  const opponentScore = useMemo(
    () => score(state.sushi, 'opponent'),
    [state.sushi],
  );

  const value = useMemo<MatchContextValue>(
    () => ({
      state,
      history,
      hydrated,
      busy,
      connectionStatus,
      lastError,
      lastUndo,
      mineScore,
      opponentScore,
      supabaseConfigured: isSupabaseConfigured,
      createMatch,
      joinRoom,
      simulateOpponentJoin,
      addSushi,
      increment,
      decrement,
      undoLast,
      clearUndo: () => setLastUndo(null),
      clearError: () => setLastError(null),
      requestEnd,
      cancelEnd,
      completeMatch,
      resetMatch,
      clearHistory,
    }),
    [
      state,
      history,
      hydrated,
      busy,
      connectionStatus,
      lastError,
      lastUndo,
      mineScore,
      opponentScore,
      createMatch,
      joinRoom,
      simulateOpponentJoin,
      addSushi,
      increment,
      decrement,
      undoLast,
      requestEnd,
      cancelEnd,
      completeMatch,
      resetMatch,
      clearHistory,
    ],
  );

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
}

export function useMatch() {
  const value = useContext(MatchContext);
  if (!value) throw new Error('useMatch must be used inside MatchProvider');
  return value;
}
