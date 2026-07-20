import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { BottomSheet } from '@/components/BottomSheet';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { PixelSushi } from '@/components/PixelSushi';
import { PixelSurface } from '@/components/PixelSurface';
import { ScoreBoard } from '@/components/ScoreBoard';
import { SushiCard } from '@/components/SushiCard';
import { UndoToast } from '@/components/UndoToast';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { RootStackParamList } from '@/navigation/types';
import { useMatch } from '@/store/MatchContext';
import { colors, motion, typography } from '@/theme/tokens';
import { SushiItem } from '@/types/match';

type Props = NativeStackScreenProps<RootStackParamList, 'Battle'>;

export function BattleScreen({ navigation }: Props) {
  const {
    state,
    busy,
    connectionStatus,
    lastError,
    mineScore,
    opponentScore,
    lastUndo,
    addSushi,
    increment,
    decrement,
    undoLast,
    clearUndo,
    clearError,
    requestEnd,
    cancelEnd,
    completeMatch,
  } = useMatch();
  const reducedMotion = useReducedMotion();
  const [addOpen, setAddOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [selected, setSelected] = useState<SushiItem | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showOvertake, setShowOvertake] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const tokenProgress = useRef(new Animated.Value(0)).current;
  const previousDifference = useRef(mineScore - opponentScore);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (opponentTimer.current) clearTimeout(opponentTimer.current);
    };
  }, []);

  useEffect(() => {
    const difference = mineScore - opponentScore;
    if (difference > 0 && previousDifference.current <= 0 && mineScore > 0) {
      setShowOvertake(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      const timer = setTimeout(() => setShowOvertake(false), 1100);
      previousDifference.current = difference;
      return () => clearTimeout(timer);
    }
    previousDifference.current = difference;
  }, [mineScore, opponentScore]);

  useEffect(() => {
    if (state.status === 'completed') navigation.replace('Result');
  }, [navigation, state.status]);

  useEffect(() => {
    if (state.status === 'end_pending') setEndOpen(true);
    if (state.status === 'active') setEndOpen(false);
  }, [state.status]);

  const filteredSushi = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase();
    if (!clean) return state.sushi;
    return state.sushi.filter((item) => item.name.toLocaleLowerCase().includes(clean));
  }, [query, state.sushi]);

  const animateToken = useCallback(() => {
    setTokenVisible(true);
    tokenProgress.setValue(0);
    Animated.timing(tokenProgress, {
      toValue: 1,
      duration: reducedMotion ? 1 : motion.celebration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setTokenVisible(false));
  }, [reducedMotion, tokenProgress]);

  const countMine = (item: SushiItem) => {
    setActiveId(item.id);
    void increment(item.id, 'mine');
    animateToken();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);

    // Local interaction preview: every second local point demonstrates an incoming opponent event.
    if (state.backend === 'demo' && (mineScore + 1) % 2 === 0) {
      opponentTimer.current = setTimeout(() => {
        void increment(item.id, 'opponent');
        Haptics.selectionAsync().catch(() => undefined);
      }, 850);
    }
  };

  const submitSushi = async () => {
    if (busy) return;
    const result = await addSushi(name);
    if (!result.ok) {
      setError(result.message ?? '添加失败');
      return;
    }
    setName('');
    setError('');
    setAddOpen(false);
  };

  const openEnd = async () => {
    if (state.status === 'end_pending') {
      setEndOpen(true);
      return;
    }
    const result = await requestEnd();
    if (result.ok) setEndOpen(true);
  };

  const continueMatch = async () => {
    const result = await cancelEnd();
    if (result.ok) setEndOpen(false);
  };

  const confirmEnd = async () => {
    const result = await completeMatch();
    if (result.ok) setEndOpen(false);
  };

  const requestedByMe =
    state.backend === 'supabase' &&
    state.endRequestedBy === state.currentUserId;

  if (!state.mine || !state.opponent) {
    return (
      <Page contentStyle={styles.center}>
        <Text style={styles.emptyTitle}>这场比赛还没有准备好</Text>
        <PixelButton label="返回首页" onPress={() => navigation.popToTop()} />
      </Page>
    );
  }

  return (
    <Page contentStyle={styles.page}>
      <AppHeader
        onRight={() => setEventsOpen(true)}
        rightLabel="记录"
        title="今天谁是寿司王"
      />
      {state.backend === 'supabase' ? (
        <View style={styles.connection}>
          <View
            style={[
              styles.connectionDot,
              connectionStatus === 'connected'
                ? styles.connectionDotOnline
                : styles.connectionDotPending,
            ]}
          />
          <Text style={styles.connectionText}>
            {connectionStatus === 'connected'
              ? '双方实时同步中'
              : connectionStatus === 'error'
                ? '连接中断，正在重试'
                : '正在连接比赛'}
          </Text>
        </View>
      ) : null}
      {lastError ? (
        <Pressable
          accessibilityRole="button"
          onPress={clearError}
          style={styles.errorBanner}
        >
          <Text style={styles.errorBannerText}>{lastError} · 点击关闭</Text>
        </Pressable>
      ) : null}
      <ScoreBoard
        mineName={state.mine.nickname}
        mineScore={mineScore}
        opponentName={state.opponent.nickname}
        opponentScore={opponentScore}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>本场寿司 · {state.sushi.length} 种</Text>
        {state.sushi.length >= 5 && (
          <TextInput
            accessibilityLabel="搜索寿司"
            onChangeText={setQuery}
            placeholder="搜索"
            placeholderTextColor={colors.mutedSoy}
            style={styles.search}
            value={query}
          />
        )}
      </View>

      <FlatList
        contentContainerStyle={[styles.list, !filteredSushi.length && styles.emptyList]}
        data={filteredSushi}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <PixelSushi size={84} />
            <Text style={styles.emptyTitle}>
              {query ? '没有找到这个寿司' : '第一份寿司上桌了吗？'}
            </Text>
            <Text style={styles.emptyText}>
              {query ? '换个名称试试' : '添加一个双方都看得懂的名字'}
            </Text>
            {!query && (
              <PixelButton
                label="添加第一个寿司"
                onPress={() => setAddOpen(true)}
                variant="secondary"
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <SushiCard
            active={activeId === item.id}
            item={item}
            onIncrement={() => countMine(item)}
            onOptions={() => setSelected(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.actions}>
        {!!state.sushi.length && (
          <PixelButton
            fullWidth
            label="＋ 添加新寿司"
            onPress={() => setAddOpen(true)}
            variant="nori"
          />
        )}
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => void openEnd()}
        >
          <Text style={styles.end}>结束比赛</Text>
        </Pressable>
      </View>

      {lastUndo && (
        <UndoToast
          onDismiss={clearUndo}
          onUndo={undoLast}
          sushiName={lastUndo.sushiName}
        />
      )}

      {tokenVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flyingToken,
            {
              opacity: tokenProgress.interpolate({
                inputRange: [0, 0.75, 1],
                outputRange: [1, 1, 0],
              }),
              transform: [
                {
                  translateY: tokenProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -430],
                  }),
                },
                {
                  translateX: tokenProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -135],
                  }),
                },
                {
                  scale: tokenProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.62, 0.25],
                  }),
                },
              ],
            },
          ]}
        >
          <PixelSushi size={72} />
        </Animated.View>
      )}

      {showOvertake && (
        <View pointerEvents="none" style={styles.overtake}>
          <View style={[styles.confetti, styles.confettiOne]} />
          <View style={[styles.confetti, styles.confettiTwo]} />
          <View style={[styles.confetti, styles.confettiThree]} />
          <PixelSurface
            backgroundColor={colors.tamago}
            contentStyle={styles.overtakeSurface}
            shadowColor={colors.lacquerRed}
          >
            <Text style={styles.overtakeText}>反超！</Text>
          </PixelSurface>
        </View>
      )}

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)}>
        <Text style={styles.sheetTitle}>添加新寿司</Text>
        <Text style={styles.inputLabel}>寿司名称</Text>
        <PixelSurface contentStyle={styles.inputSurface} radiusValue={12}>
          <TextInput
            accessibilityLabel="寿司名称"
            autoFocus
            maxLength={30}
            onChangeText={(value) => {
              setName(value);
              setError('');
            }}
            onSubmitEditing={() => void submitSushi()}
            placeholder="例如：炙烧三文鱼"
            placeholderTextColor={colors.mutedSoy}
            returnKeyType="done"
            style={styles.input}
            value={name}
          />
        </PixelSurface>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.sheetActions}>
          <PixelButton
            label="取消"
            onPress={() => setAddOpen(false)}
            variant="ghost"
          />
          <PixelButton
            disabled={!name.trim() || busy}
            label={busy ? '同步中…' : '添加'}
            onPress={() => void submitSushi()}
          />
        </View>
      </BottomSheet>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        <Text style={styles.sheetTitle}>{selected?.name}</Text>
        <Text style={styles.sheetText}>自己的记录：{selected?.mine ?? 0} 个</Text>
        <PixelButton
          disabled={!selected?.mine}
          fullWidth
          label="修正：减少一个"
          onPress={() => {
            if (selected) void decrement(selected.id);
            setSelected(null);
          }}
          variant="secondary"
        />
        <PixelButton fullWidth label="完成" onPress={() => setSelected(null)} variant="ghost" />
      </BottomSheet>

      <BottomSheet visible={endOpen} onClose={() => setEndOpen(false)}>
        <Text style={styles.sheetTitle}>
          {requestedByMe
            ? '等待对手确认…'
            : state.backend === 'supabase'
              ? '对手想结束比赛'
              : '结束这场比赛？'}
        </Text>
        <Text style={styles.sheetText}>
          {requestedByMe
            ? `已通知 ${state.opponent.nickname}，对方确认后会自动生成战报。`
            : '确认后比分会锁定，并生成本场战报。'}
        </Text>
        {!requestedByMe ? (
          <PixelButton
            fullWidth
            label="确认，结束比赛"
            onPress={() => void confirmEnd()}
          />
        ) : null}
        <PixelButton
          fullWidth
          label={requestedByMe ? '撤回申请，继续比赛' : '还没吃够，继续比赛'}
          onPress={() => void continueMatch()}
          variant="ghost"
        />
      </BottomSheet>

      <BottomSheet visible={eventsOpen} onClose={() => setEventsOpen(false)}>
        <Text style={styles.sheetTitle}>比赛记录</Text>
        <FlatList
          data={[...state.events].reverse().slice(0, 8)}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.sheetText}>还没有操作记录</Text>}
          renderItem={({ item }) => (
            <View style={styles.eventRow}>
              <View style={styles.eventDot} />
              <Text style={styles.eventText}>{item.description}</Text>
              <Text style={styles.eventTime}>
                {new Date(item.createdAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          style={styles.events}
        />
        <PixelButton fullWidth label="完成" onPress={() => setEventsOpen(false)} variant="ghost" />
      </BottomSheet>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 18,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  connection: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 26,
    marginTop: -4,
    paddingHorizontal: 10,
    backgroundColor: colors.riceDeep,
  },
  connectionDot: {
    width: 8,
    height: 8,
  },
  connectionDotOnline: {
    backgroundColor: colors.success,
  },
  connectionDotPending: {
    backgroundColor: colors.tamago,
  },
  connectionText: {
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 12,
  },
  errorBanner: {
    minHeight: 38,
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.blush,
  },
  errorBannerText: {
    color: colors.lacquerRed,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 18,
    fontWeight: '700',
  },
  search: {
    minWidth: 88,
    minHeight: 42,
    paddingHorizontal: 12,
    color: colors.soy,
    textAlign: 'right',
    fontFamily: typography.regular,
    fontSize: 14,
  },
  list: {
    gap: 18,
    paddingHorizontal: 3,
    paddingTop: 6,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 42,
  },
  emptyTitle: {
    marginTop: 18,
    color: colors.soy,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: 21,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 8,
    marginBottom: 22,
    color: colors.mutedSoy,
    textAlign: 'center',
    fontFamily: typography.regular,
    fontSize: 15,
  },
  actions: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 8,
  },
  end: {
    minHeight: 42,
    paddingTop: 12,
    color: colors.lacquerRed,
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
  flyingToken: {
    position: 'absolute',
    right: 24,
    bottom: 138,
    zIndex: 20,
  },
  overtake: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overtakeSurface: {
    minWidth: 188,
    alignItems: 'center',
    paddingHorizontal: 34,
    paddingVertical: 22,
  },
  overtakeText: {
    color: colors.soy,
    fontFamily: typography.display,
    fontSize: 44,
  },
  confetti: {
    position: 'absolute',
    width: 14,
    height: 14,
  },
  confettiOne: {
    left: '22%',
    top: '42%',
    backgroundColor: colors.salmon,
  },
  confettiTwo: {
    right: '20%',
    top: '36%',
    backgroundColor: colors.nori,
  },
  confettiThree: {
    right: '29%',
    bottom: '37%',
    backgroundColor: colors.tamago,
  },
  sheetTitle: {
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 27,
    fontWeight: '800',
  },
  sheetText: {
    marginTop: 12,
    marginBottom: 24,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 25,
  },
  inputLabel: {
    marginTop: 24,
    marginBottom: 10,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 15,
  },
  inputSurface: {
    minHeight: 62,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    minHeight: 50,
    color: colors.soy,
    fontFamily: typography.regular,
    fontSize: 19,
  },
  error: {
    marginTop: 10,
    color: colors.lacquerRed,
    fontFamily: typography.medium,
    fontSize: 14,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 30,
  },
  events: {
    maxHeight: 340,
    marginTop: 18,
    marginBottom: 18,
  },
  eventRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.salmon,
  },
  eventText: {
    flex: 1,
    color: colors.soy,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  eventTime: {
    color: colors.mutedSoy,
    fontFamily: typography.display,
    fontSize: 13,
  },
});
