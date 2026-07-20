import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Page } from '@/components/Page';
import { PixelButton } from '@/components/PixelButton';
import { RootStackParamList } from '@/navigation/types';
import { colors, typography } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

function roomFromData(data: string) {
  try {
    const parsed = new URL(data);
    if (parsed.protocol !== 'sushiking:' || parsed.hostname !== 'join') {
      return undefined;
    }
    const code = parsed.searchParams.get('roomCode')?.trim().toUpperCase();
    return code && /^[A-F0-9]{10}$/.test(code) ? code : undefined;
  } catch {
    return undefined;
  }
}

export function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState('');

  const continueWithRoom = (code = 'DEMO88') => {
    navigation.replace('Nickname', { mode: 'join', roomCode: code });
  };

  if (!permission) {
    return (
      <Page contentStyle={styles.center}>
        <Text style={styles.message}>正在检查相机权限…</Text>
      </Page>
    );
  }

  if (!permission.granted) {
    return (
      <Page>
        <AppHeader title="扫码加入" onBack={navigation.goBack} />
        <View style={styles.center}>
          <Text style={styles.title}>需要相机权限</Text>
          <Text style={styles.message}>相机只用于扫描本场比赛二维码，不会保存照片。</Text>
          <PixelButton fullWidth label="允许使用相机" onPress={requestPermission} />
          <PixelButton
            fullWidth
            label="不用相机，体验演示房间"
            onPress={() => continueWithRoom()}
            variant="secondary"
          />
        </View>
      </Page>
    );
  }

  return (
    <View style={styles.cameraPage}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanned
            ? undefined
            : ({ data }) => {
                const code = roomFromData(data);
                if (!code) {
                  setScanError('这不是有效的寿司比赛二维码，请重新扫描');
                  setScanned(true);
                  setTimeout(() => setScanned(false), 1200);
                  return;
                }
                setScanned(true);
                continueWithRoom(code);
              }
        }
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cameraOverlay}>
        <AppHeader title="扫描比赛二维码" onBack={navigation.goBack} />
        <View style={styles.finder}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.cameraHint}>把二维码放进框里</Text>
        {scanError ? (
          <Text accessibilityLiveRegion="polite" style={styles.scanError}>
            {scanError}
          </Text>
        ) : null}
        <PixelButton
          label="体验演示房间"
          onPress={() => continueWithRoom()}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 26,
    fontWeight: '800',
  },
  message: {
    maxWidth: 330,
    color: colors.mutedSoy,
    textAlign: 'center',
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 25,
  },
  cameraPage: {
    flex: 1,
    backgroundColor: colors.soy,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: 'rgba(42,28,26,0.36)',
  },
  finder: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderColor: colors.tamago,
  },
  topLeft: {
    left: 0,
    top: 0,
    borderLeftWidth: 8,
    borderTopWidth: 8,
  },
  topRight: {
    right: 0,
    top: 0,
    borderRightWidth: 8,
    borderTopWidth: 8,
  },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 8,
    borderBottomWidth: 8,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 8,
    borderBottomWidth: 8,
  },
  cameraHint: {
    color: colors.rice,
    fontFamily: typography.medium,
    fontSize: 18,
    fontWeight: '700',
  },
  scanError: {
    maxWidth: 320,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.surface,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: colors.lacquerRed,
  },
});
