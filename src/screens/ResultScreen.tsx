import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { DecorativePixels } from '@/components/DecorativePixels';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { PixelSushi } from '@/components/PixelSushi';
import { PixelSurface } from '@/components/PixelSurface';
import { RootStackParamList } from '@/navigation/types';
import { useMatch } from '@/store/MatchContext';
import { colors, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

function formatDuration(startedAt: number | null, endedAt: number | null) {
  if (!startedAt || !endedAt) return '本场已结束';
  const minutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));
  return `激战 ${minutes} 分钟`;
}

export function ResultScreen({ navigation }: Props) {
  const { state, mineScore, opponentScore, resetMatch } = useMatch();
  const winner =
    mineScore === opponentScore
      ? null
      : mineScore > opponentScore
        ? state.mine?.nickname
        : state.opponent?.nickname;

  const overtakeCount = useMemo(() => {
    let mine = 0;
    let opponent = 0;
    let leader = 0;
    let overtakes = 0;
    for (const item of state.events) {
      if (item.kind !== 'increment') continue;
      if (item.side === 'mine') mine += item.delta ?? 1;
      else opponent += item.delta ?? 1;
      const nextLeader = Math.sign(mine - opponent);
      if (leader !== 0 && nextLeader !== 0 && nextLeader !== leader) overtakes += 1;
      if (nextLeader !== 0) leader = nextLeader;
    }
    return overtakes;
  }, [state.events]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);

  const goHome = () => {
    resetMatch();
    navigation.popToTop();
  };

  const share = () => {
    const result = winner ? `${winner}成为了寿司王！` : '这场寿司对决打成平局！';
    Share.share({
      title: '今天谁是寿司王',
      message: `${result}\n${state.mine?.nickname ?? '我'} ${mineScore} : ${opponentScore} ${state.opponent?.nickname ?? '对手'}\n共挑战 ${state.sushi.length} 种寿司。`,
    }).catch(() => undefined);
  };

  return (
    <Page backgroundColor={colors.counterOrange} contentStyle={styles.page}>
      <DecorativePixels />
      <View style={styles.celebration}>
        <PixelSushi crowned size={112} />
        <Text style={styles.title}>{winner ? `${winner}是寿司王！` : '势均力敌！'}</Text>
        <Text accessibilityLabel={`最终比分 ${mineScore} 比 ${opponentScore}`} style={styles.score}>
          {mineScore} : {opponentScore}
        </Text>
        <Text style={styles.duration}>{formatDuration(state.startedAt, state.endedAt)}</Text>
      </View>

      <PixelSurface
        backgroundColor={colors.surface}
        contentStyle={styles.stats}
        shadowColor={colors.blush}
      >
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.nori }]}>{state.sushi.length}</Text>
          <Text style={styles.statLabel}>寿司种类</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.lacquerRed }]}>{overtakeCount}</Text>
          <Text style={styles.statLabel}>反超次数</Text>
        </View>
      </PixelSurface>

      <View style={styles.actions}>
        <PixelButton fullWidth label="分享战报" onPress={share} />
        <PixelButton fullWidth label="返回首页" onPress={goHome} variant="ghost" />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 24,
  },
  celebration: {
    alignItems: 'center',
  },
  title: {
    marginTop: 18,
    color: colors.soy,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: 30,
    fontWeight: '800',
  },
  score: {
    marginTop: 18,
    color: colors.lacquerRed,
    fontFamily: typography.display,
    fontSize: 68,
    lineHeight: 76,
  },
  duration: {
    marginTop: 8,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 16,
  },
  stats: {
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.display,
    fontSize: 52,
    lineHeight: 58,
  },
  statLabel: {
    marginTop: 4,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  divider: {
    width: 4,
    height: 92,
    backgroundColor: colors.riceDeep,
  },
  actions: {
    gap: 16,
  },
});
