import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { DecorativePixels } from '@/components/DecorativePixels';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { PixelSushi } from '@/components/PixelSushi';
import { RootStackParamList } from '@/navigation/types';
import { useMatch } from '@/store/MatchContext';
import { colors, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { state, history } = useMatch();
  const resumable = state.status === 'active' || state.status === 'end_pending';
  const waiting = state.status === 'waiting';

  return (
    <Page backgroundColor={colors.rice} contentStyle={styles.page}>
      <DecorativePixels />
      <View style={styles.hero}>
        <PixelSushi crowned size={118} />
        <Text style={styles.title}>今天谁是寿司王</Text>
        <Text style={styles.subtitle}>两个人 · 一场寿司对决</Text>
      </View>

      <View style={styles.actions}>
        {waiting && (
          <PixelButton
            fullWidth
            label="继续等待对手"
            onPress={() => navigation.navigate('Waiting')}
            variant="nori"
          />
        )}
        {resumable && (
          <PixelButton
            fullWidth
            label="继续当前比赛"
            onPress={() => navigation.navigate('Battle')}
            variant="nori"
          />
        )}
        <PixelButton
          fullWidth
          label="创建比赛"
          onPress={() => navigation.navigate('Nickname', { mode: 'create' })}
        />
        <PixelButton
          fullWidth
          label="扫码加入"
          onPress={() => navigation.navigate('Scanner')}
          variant="secondary"
        />
      </View>

      <PixelButton
        accessibilityLabel={`历史战绩，共 ${history.length} 场`}
        label={`历史战绩${history.length ? ` · ${history.length}` : ''}`}
        onPress={() => navigation.navigate('History')}
        variant="ghost"
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 72,
    paddingBottom: 42,
  },
  hero: {
    alignItems: 'center',
  },
  title: {
    marginTop: 22,
    color: colors.soy,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 16,
  },
  actions: {
    width: '100%',
    gap: 18,
  },
});
