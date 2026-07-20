import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppHeader } from '@/components/AppHeader';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { PixelSurface } from '@/components/PixelSurface';
import { createInviteLink } from '@/lib/invite';
import { RootStackParamList } from '@/navigation/types';
import { useMatch } from '@/store/MatchContext';
import { colors, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Waiting'>;

export function WaitingScreen({ navigation }: Props) {
  const {
    state,
    connectionStatus,
    lastError,
    simulateOpponentJoin,
    resetMatch,
  } = useMatch();
  const link = createInviteLink(state.roomCode);

  useEffect(() => {
    if (state.status === 'active') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      navigation.replace('Battle');
    }
  }, [navigation, state.status]);

  useEffect(() => {
    if (state.status === 'expired') {
      resetMatch();
      navigation.popToTop();
    }
  }, [navigation, resetMatch, state.status]);

  const cancel = () => {
    resetMatch();
    navigation.popToTop();
  };

  return (
    <Page>
      <AppHeader title="今天谁是寿司王" onBack={cancel} />
      <View style={styles.content}>
        <PixelSurface
          backgroundColor={colors.surface}
          contentStyle={styles.qrSurface}
          radiusValue={16}
          shadowColor={colors.blush}
        >
          <QRCode
            backgroundColor={colors.surface}
            color={colors.soy}
            quietZone={8}
            size={220}
            value={link}
          />
        </PixelSurface>

        <View style={styles.waiting}>
          <Text style={styles.title}>等待对手加入…</Text>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: colors.salmon }]} />
            <View style={[styles.dot, { backgroundColor: colors.tamago }]} />
            <View style={[styles.dot, { backgroundColor: colors.blush }]} />
          </View>
          <Text selectable style={styles.code}>房间码 {state.roomCode}</Text>
          <Text style={styles.scanHint}>用手机系统相机扫码即可加入</Text>
          {state.backend === 'supabase' ? (
            <View style={styles.liveStatus}>
              <View
                style={[
                  styles.liveDot,
                  connectionStatus === 'connected'
                    ? styles.liveDotConnected
                    : styles.liveDotConnecting,
                ]}
              />
              <Text style={styles.liveText}>
                {connectionStatus === 'connected'
                  ? '实时房间已连接'
                  : connectionStatus === 'error'
                    ? '正在重新连接'
                    : '正在连接实时房间'}
              </Text>
            </View>
          ) : (
            <Text style={styles.demoText}>本机演示房间</Text>
          )}
          {lastError ? <Text style={styles.error}>{lastError}</Text> : null}
        </View>

        <PixelSurface contentStyle={styles.player}>
          <View style={styles.avatar} />
          <Text style={styles.playerName}>{state.mine?.nickname}</Text>
          <Text style={styles.ready}>已就位</Text>
        </PixelSurface>
      </View>

      <View style={styles.footer}>
        {state.backend === 'demo' ? (
          <PixelButton
            fullWidth
            label="本机演示：模拟对手加入"
            onPress={() => simulateOpponentJoin()}
            variant="secondary"
          />
        ) : null}
        <PixelButton fullWidth label="取消比赛" onPress={cancel} variant="ghost" />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSurface: {
    padding: 18,
  },
  waiting: {
    alignItems: 'center',
    marginTop: 34,
  },
  title: {
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 23,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  dot: {
    width: 11,
    height: 11,
  },
  code: {
    marginTop: 18,
    color: colors.mutedSoy,
    fontFamily: typography.display,
    fontSize: 19,
    letterSpacing: 1.4,
  },
  scanHint: {
    marginTop: 10,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  liveDot: {
    width: 9,
    height: 9,
  },
  liveDotConnected: {
    backgroundColor: colors.success,
  },
  liveDotConnecting: {
    backgroundColor: colors.tamago,
  },
  liveText: {
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  demoText: {
    marginTop: 16,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  error: {
    maxWidth: 300,
    marginTop: 12,
    color: colors.lacquerRed,
    textAlign: 'center',
    fontFamily: typography.regular,
    fontSize: 13,
  },
  player: {
    width: 320,
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  avatar: {
    width: 42,
    height: 42,
    marginRight: 14,
    backgroundColor: colors.salmon,
    borderRadius: 12,
  },
  playerName: {
    flex: 1,
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 18,
    fontWeight: '700',
  },
  ready: {
    color: colors.success,
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    gap: 14,
    paddingBottom: 6,
  },
});
