import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { PixelSushi } from '@/components/PixelSushi';
import { PixelSurface } from '@/components/PixelSurface';
import { RootStackParamList } from '@/navigation/types';
import { useMatch } from '@/store/MatchContext';
import { colors, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Nickname'>;
const NICKNAME_KEY = '@sushi-king/last-nickname';

export function NicknameScreen({ navigation, route }: Props) {
  const { busy, createMatch, joinRoom } = useMatch();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const creating = route.params.mode === 'create';

  useEffect(() => {
    AsyncStorage.getItem(NICKNAME_KEY).then((saved) => {
      if (saved) setNickname(saved);
    });
  }, []);

  const submit = async () => {
    if (busy) return;
    const clean = nickname.trim();
    if (!clean) {
      setError('请先告诉对手你叫什么');
      return;
    }
    if (clean.length > 12) {
      setError('昵称最多 12 个字');
      return;
    }
    AsyncStorage.setItem(NICKNAME_KEY, clean).catch(() => undefined);
    const result = creating
      ? await createMatch(clean)
      : await joinRoom(clean, route.params.roomCode);
    if (!result.ok) {
      setError(result.message ?? '操作失败，请稍后再试');
      return;
    }
    navigation.replace(creating ? 'Waiting' : 'Battle');
  };

  return (
    <Page>
      <AppHeader title={creating ? '创建比赛' : '加入比赛'} onBack={navigation.goBack} />
      <View style={styles.content}>
        <View style={styles.mascot}>
          <PixelSushi size={88} />
          <Text style={styles.prompt}>
            {creating ? '准备好争夺王冠了吗？' : '最后一步，报上名号'}
          </Text>
        </View>

        <View>
          <Text style={styles.label}>你的昵称</Text>
          <PixelSurface contentStyle={styles.inputSurface} radiusValue={12}>
            <TextInput
              accessibilityLabel="你的昵称"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={12}
              onChangeText={(value) => {
                setNickname(value);
                setError('');
              }}
              onSubmitEditing={() => void submit()}
              placeholder="例如：阿杰"
              placeholderTextColor={colors.mutedSoy}
              returnKeyType="done"
              style={styles.input}
              value={nickname}
            />
          </PixelSurface>
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <Text style={styles.hint}>本场只显示昵称，不需要注册</Text>
        </View>
      </View>

      <PixelButton
        disabled={!nickname.trim() || busy}
        fullWidth
        label={busy ? '寿司台连接中…' : creating ? '创建比赛' : '加入并开始'}
        onPress={() => void submit()}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 52,
  },
  mascot: {
    alignItems: 'center',
  },
  prompt: {
    marginTop: 14,
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    marginBottom: 10,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 15,
  },
  inputSurface: {
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  input: {
    minHeight: 52,
    color: colors.soy,
    fontFamily: typography.regular,
    fontSize: 22,
  },
  hint: {
    marginTop: 14,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  error: {
    marginTop: 12,
    color: colors.lacquerRed,
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
});
