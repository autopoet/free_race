import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, layout, radius } from '@/theme/tokens';

interface PixelSurfaceProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  shadowColor?: string;
  shadowOffset?: number;
  radiusValue?: number;
}

export function PixelSurface({
  children,
  style,
  contentStyle,
  backgroundColor = colors.surface,
  shadowColor = colors.blush,
  shadowOffset = layout.shadowOffset,
  radiusValue = radius.card,
}: PixelSurfaceProps) {
  return (
    <View style={[styles.wrapper, { marginBottom: shadowOffset }, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          {
            backgroundColor: shadowColor,
            borderRadius: radiusValue,
            transform: [{ translateY: shadowOffset }],
          },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            backgroundColor,
            borderRadius: radiusValue,
          },
          contentStyle,
        ]}
      >
        <View pointerEvents="none" style={[styles.pixelCut, styles.topLeft, { backgroundColor: shadowColor }]} />
        <View pointerEvents="none" style={[styles.pixelCut, styles.bottomRight, { backgroundColor: shadowColor }]} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    overflow: 'hidden',
  },
  pixelCut: {
    position: 'absolute',
    width: 6,
    height: 6,
    opacity: 0.72,
  },
  topLeft: {
    left: 0,
    top: 0,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
  },
});
