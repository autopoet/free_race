import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { PixelButton } from '@/components/PixelButton';
import { PixelSurface } from '@/components/PixelSurface';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, motion, typography } from '@/theme/tokens';
import { SushiItem } from '@/types/match';

interface SushiCardProps {
  item: SushiItem;
  onIncrement: () => void;
  onOptions: () => void;
  active?: boolean;
}

export function SushiCard({
  item,
  onIncrement,
  onOptions,
  active = false,
}: SushiCardProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    pulse.setValue(1.22);
    Animated.timing(pulse, {
      toValue: 1,
      duration: motion.feedback,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [item.mine, pulse, reducedMotion]);

  return (
    <PixelSurface
      backgroundColor={active ? colors.riceDeep : colors.surface}
      shadowColor={active ? colors.lacquerRed : colors.blush}
      contentStyle={styles.surface}
    >
      {active && <View style={styles.activeRail} />}
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Pressable
          accessibilityLabel={`管理${item.name}`}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onOptions}
          style={styles.more}
        >
          <Text style={styles.moreText}>•••</Text>
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <View style={styles.counts}>
          <View>
            <Text style={styles.label}>我</Text>
            <Animated.Text style={[styles.mineCount, { transform: [{ scale: pulse }] }]}>
              {item.mine}
            </Animated.Text>
          </View>
          <View>
            <Text style={styles.label}>对方</Text>
            <Text style={styles.opponentCount}>{item.opponent}</Text>
          </View>
        </View>
        <PixelButton
          accessibilityLabel={`我又吃了一个${item.name}`}
          compact
          label="+1"
          onPress={onIncrement}
          textStyle={styles.plus}
        />
      </View>
    </PixelSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    minHeight: 172,
    padding: 20,
  },
  activeRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: colors.tamago,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
    color: colors.soy,
    fontFamily: typography.medium,
    fontSize: 22,
    fontWeight: '700',
  },
  more: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: colors.mutedSoy,
    fontFamily: typography.display,
    fontSize: 20,
    letterSpacing: 2,
  },
  bottom: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  counts: {
    flexDirection: 'row',
    gap: 38,
  },
  label: {
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  mineCount: {
    color: colors.lacquerRed,
    fontFamily: typography.display,
    fontSize: 32,
    lineHeight: 36,
  },
  opponentCount: {
    color: colors.soy,
    fontFamily: typography.display,
    fontSize: 32,
    lineHeight: 36,
  },
  plus: {
    fontFamily: typography.display,
    fontSize: 25,
  },
});
