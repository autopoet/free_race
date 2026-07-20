import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

interface PixelSushiProps {
  size?: number;
  crowned?: boolean;
}

export function PixelSushi({ size = 92, crowned = false }: PixelSushiProps) {
  const scale = size / 92;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
      {crowned && (
        <View style={[styles.crown, { transform: [{ scale }], left: 13 * scale, top: 0 }]} />
      )}
      <View
        style={[
          styles.salmon,
          {
            width: 82 * scale,
            height: 24 * scale,
            left: 5 * scale,
            top: (crowned ? 28 : 16) * scale,
          },
        ]}
      >
        <View style={[styles.salmonShine, { width: 40 * scale, height: 6 * scale, left: 10 * scale, top: 0 }]} />
      </View>
      <View
        style={[
          styles.rice,
          {
            width: 68 * scale,
            height: 34 * scale,
            left: 12 * scale,
            top: (crowned ? 46 : 34) * scale,
          },
        ]}
      >
        <View style={[styles.eye, { left: 14 * scale, top: 14 * scale, width: 6 * scale, height: 6 * scale }]} />
        <View style={[styles.eye, { right: 14 * scale, top: 14 * scale, width: 6 * scale, height: 6 * scale }]} />
        <View style={[styles.blush, { left: 24 * scale, top: 22 * scale, width: 6 * scale, height: 4 * scale }]} />
        <View style={[styles.blush, { right: 24 * scale, top: 22 * scale, width: 6 * scale, height: 4 * scale }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  crown: {
    position: 'absolute',
    width: 66,
    height: 26,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderColor: colors.tamago,
  },
  salmon: {
    position: 'absolute',
    backgroundColor: colors.salmon,
  },
  salmonShine: {
    position: 'absolute',
    backgroundColor: '#FFAA87',
  },
  rice: {
    position: 'absolute',
    backgroundColor: colors.surface,
  },
  eye: {
    position: 'absolute',
    backgroundColor: colors.soy,
  },
  blush: {
    position: 'absolute',
    backgroundColor: colors.lacquerRed,
  },
});
