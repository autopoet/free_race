import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, radius } from '@/theme/tokens';

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {children}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  safe: {
    width: '100%',
    maxWidth: layout.maxPhoneWidth,
    alignSelf: 'center',
  },
  sheet: {
    minHeight: 250,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: colors.rice,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handle: {
    width: 76,
    height: 7,
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: colors.blush,
    borderRadius: 2,
  },
});
