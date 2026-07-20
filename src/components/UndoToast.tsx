import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

interface UndoToastProps {
  sushiName: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ sushiName, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4200);
    return () => clearTimeout(timer);
  }, [onDismiss, sushiName]);

  return (
    <View accessibilityLiveRegion="polite" style={styles.toast}>
      <Text numberOfLines={1} style={styles.message}>已记录「{sushiName}」+1</Text>
      <Pressable accessibilityRole="button" hitSlop={12} onPress={onUndo}>
        <Text style={styles.undo}>撤销</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 104,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    backgroundColor: colors.soy,
    borderRadius: 12,
    borderBottomWidth: 5,
    borderBottomColor: colors.soyDeep,
  },
  message: {
    flex: 1,
    color: colors.rice,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  undo: {
    color: colors.tamago,
    fontFamily: typography.medium,
    fontSize: 15,
    fontWeight: '700',
  },
});
