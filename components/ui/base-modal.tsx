import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { type ReactNode } from 'react';

export function BaseModal({
  visible,
  onClose,
  children,
  backdropDisabled,
  align = 'center',
  maxWidth = 460,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  backdropDisabled?: boolean;
  align?: 'center' | 'bottom';
  maxWidth?: number;
}) {
  const alignClass =
    align === 'bottom' ? 'justify-end' : 'items-center justify-center px-4';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className={`flex-1 bg-black/40 ${alignClass}`}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          disabled={backdropDisabled}
        />
        <View style={{ width: '100%', maxWidth }} className="items-center">
          {children}
        </View>
      </View>
    </Modal>
  );
}