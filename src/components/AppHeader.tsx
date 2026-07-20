import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightLabel?: string;
  onRight?: () => void;
}

export function AppHeader({ title, onBack, rightLabel, onRight }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack && (
          <Pressable
            accessibilityLabel="返回"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={styles.action}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
        )}
      </View>
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      <View style={[styles.side, styles.right]}>
        {rightLabel && onRight && (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onRight}
            style={styles.action}
          >
            <Text style={styles.rightText}>{rightLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 86,
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
  },
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    color: colors.soy,
    fontFamily: typography.regular,
    fontSize: 42,
    lineHeight: 42,
  },
  title: {
    flex: 1,
    color: colors.soy,
    textAlign: 'center',
    fontFamily: typography.medium,
    fontSize: 20,
    fontWeight: '700',
  },
  rightText: {
    color: colors.lacquerRed,
    fontFamily: typography.medium,
    fontSize: 14,
    fontWeight: '600',
  },
});
