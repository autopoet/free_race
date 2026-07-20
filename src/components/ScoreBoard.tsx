import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { PixelSurface } from '@/components/PixelSurface';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, motion, typography } from '@/theme/tokens';

interface ScoreBoardProps {
  mineName: string;
  opponentName: string;
  mineScore: number;
  opponentScore: number;
  compact?: boolean;
}

function ScoreNumber({ value, color }: { value: number; color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    pulse.setValue(1.18);
    Animated.timing(pulse, {
      toValue: 1,
      duration: motion.feedback,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pulse, reducedMotion, value]);

  return (
    <Animated.Text style={[styles.score, { color, transform: [{ scale: pulse }] }]}>
      {value}
    </Animated.Text>
  );
}

export function ScoreBoard({
  mineName,
  opponentName,
  mineScore,
  opponentScore,
  compact = false,
}: ScoreBoardProps) {
  const difference = mineScore - opponentScore;
  const status =
    difference === 0
      ? '当前平局'
      : difference > 0
        ? `${mineName}领先 ${difference} 个`
        : `${opponentName}领先 ${Math.abs(difference)} 个`;

  return (
    <PixelSurface
      backgroundColor={colors.soy}
      shadowColor={colors.soyDeep}
      radiusValue={16}
      contentStyle={[styles.surface, compact && styles.compactSurface]}
    >
      <View style={styles.names}>
        <Text numberOfLines={1} style={styles.name}>{mineName}</Text>
        <Text numberOfLines={1} style={styles.name}>{opponentName}</Text>
      </View>
      <View style={styles.scoreRow}>
        <ScoreNumber color={colors.tamago} value={mineScore} />
        <Text style={styles.vs}>VS</Text>
        <ScoreNumber color={colors.salmon} value={opponentScore} />
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
    </PixelSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    minHeight: 158,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 14,
  },
  compactSurface: {
    minHeight: 142,
  },
  names: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  name: {
    maxWidth: '42%',
    color: colors.rice,
    fontFamily: typography.medium,
    fontSize: 15,
    fontWeight: '600',
  },
  scoreRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  score: {
    minWidth: 92,
    textAlign: 'center',
    fontFamily: typography.display,
    fontSize: 62,
    lineHeight: 70,
  },
  vs: {
    color: colors.blush,
    fontFamily: typography.display,
    fontSize: 25,
  },
  status: {
    color: colors.riceDeep,
    textAlign: 'center',
    fontFamily: typography.regular,
    fontSize: 14,
  },
});
