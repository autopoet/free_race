import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { PixelSushi } from '@/components/PixelSushi';
import { PixelSurface } from '@/components/PixelSurface';
import { RootStackParamList } from '@/navigation/types';
import { useMatch } from '@/store/MatchContext';
import { colors, typography } from '@/theme/tokens';
import { MatchHistory } from '@/types/match';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

function HistoryCard({ item }: { item: MatchHistory }) {
  const result =
    item.winner === 'tie'
      ? '平局'
      : item.winner === 'mine'
        ? `${item.mine}获胜`
        : `${item.opponent}获胜`;

  return (
    <PixelSurface contentStyle={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
          {new Date(item.endedAt).toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.result}>{result}</Text>
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.player}>
          <Text numberOfLines={1} style={styles.name}>{item.mine}</Text>
          <Text style={[styles.score, { color: colors.lacquerRed }]}>{item.mineScore}</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.player}>
          <Text numberOfLines={1} style={styles.name}>{item.opponent}</Text>
          <Text style={[styles.score, { color: colors.soy }]}>{item.opponentScore}</Text>
        </View>
      </View>
      <Text style={styles.meta}>挑战了 {item.sushiCount} 种寿司</Text>
    </PixelSurface>
  );
}

export function HistoryScreen({ navigation }: Props) {
  const { history, clearHistory } = useMatch();

  return (
    <Page contentStyle={styles.page}>
      <AppHeader
        onBack={navigation.goBack}
        onRight={history.length ? clearHistory : undefined}
        rightLabel={history.length ? '清空' : undefined}
        title="历史战绩"
      />
      <FlatList
        contentContainerStyle={[styles.list, !history.length && styles.emptyList]}
        data={history}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <PixelSushi size={94} />
            <Text style={styles.emptyTitle}>还没有战绩</Text>
            <Text style={styles.emptyText}>完成第一场寿司对决后，战报会保存在这里。</Text>
            <PixelButton label="返回首页" onPress={navigation.goBack} variant="secondary" />
          </View>
        }
        renderItem={({ item }) => <HistoryCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 18,
  },
  list: {
    gap: 20,
    paddingHorizontal: 3,
    paddingTop: 14,
    paddingBottom: 26,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 20,
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    maxWidth: 310,
    marginTop: 10,
    marginBottom: 24,
    color: colors.mutedSoy,
    textAlign: 'center',
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  result: {
    color: colors.success,
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '700',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  player: {
    flex: 1,
    alignItems: 'center',
  },
  name: {
    maxWidth: 120,
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 16,
    fontWeight: '600',
  },
  score: {
    fontFamily: typography.display,
    fontSize: 44,
  },
  vs: {
    color: colors.blush,
    fontFamily: typography.display,
    fontSize: 20,
  },
  meta: {
    marginTop: 12,
    color: colors.mutedSoy,
    textAlign: 'center',
    fontFamily: typography.regular,
    fontSize: 13,
  },
});
