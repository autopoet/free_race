import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function DecorativePixels() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.pixel, styles.one]} />
      <View style={[styles.pixel, styles.two]} />
      <View style={[styles.pixel, styles.three]} />
      <View style={[styles.pixel, styles.four]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pixel: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  one: {
    left: 28,
    top: 32,
    backgroundColor: colors.tamago,
  },
  two: {
    right: 34,
    top: 78,
    backgroundColor: colors.salmon,
  },
  three: {
    left: 48,
    bottom: 50,
    backgroundColor: colors.nori,
  },
  four: {
    right: 26,
    bottom: 94,
    backgroundColor: colors.blush,
  },
});
