import * as Haptics from 'expo-haptics';
import { PropsWithChildren, useRef } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, layout, motion, radius, typography } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'nori' | 'ghost';

interface PixelButtonProps extends PropsWithChildren {
  label?: string;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const variants = {
  primary: {
    front: colors.salmon,
    shadow: colors.lacquerRed,
    text: colors.surface,
  },
  secondary: {
    front: colors.tamago,
    shadow: colors.tamagoShadow,
    text: colors.soy,
  },
  nori: {
    front: colors.nori,
    shadow: colors.noriShadow,
    text: colors.surface,
  },
  ghost: {
    front: colors.riceDeep,
    shadow: colors.blush,
    text: colors.soy,
  },
} as const;

export function PixelButton({
  children,
  label,
  onPress,
  onLongPress,
  variant = 'primary',
  disabled = false,
  compact = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: PixelButtonProps) {
  const translate = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  const palette = variants[variant];

  const animate = (toValue: number) => {
    Animated.timing(translate, {
      toValue,
      duration: reducedMotion ? 1 : motion.instant,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => undefined);
    onPress?.(event);
  };

  return (
    <View style={[styles.wrapper, fullWidth && styles.fullWidth, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          compact ? styles.compactShadow : styles.regularShadow,
          { backgroundColor: palette.shadow },
        ]}
      />
      <Animated.View
        style={[
          fullWidth && styles.fullWidth,
          {
            transform: [
              { translateY: translate },
              {
                scale: translate.interpolate({
                  inputRange: [0, 4],
                  outputRange: [1, 0.985],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onLongPress={onLongPress}
          onPress={handlePress}
          onPressIn={() => animate(4)}
          onPressOut={() => animate(0)}
          style={[
            styles.front,
            compact ? styles.compact : styles.regular,
            fullWidth && styles.fullWidth,
            { backgroundColor: palette.front },
            disabled && styles.disabled,
          ]}
        >
          <View pointerEvents="none" style={styles.highlight} />
          {children ?? (
            <Text
              style={[
                styles.label,
                compact && styles.compactLabel,
                { color: palette.text },
                textStyle,
              ]}
            >
              {label}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: layout.shadowOffset,
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -layout.shadowOffset,
    borderRadius: radius.control,
  },
  regularShadow: {
    height: 56,
  },
  compactShadow: {
    height: 48,
  },
  front: {
    minWidth: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
    overflow: 'hidden',
  },
  regular: {
    minHeight: 56,
    paddingHorizontal: 24,
  },
  compact: {
    minHeight: 48,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: typography.medium,
    fontSize: 17,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 16,
  },
  highlight: {
    position: 'absolute',
    left: 12,
    top: 8,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
});
