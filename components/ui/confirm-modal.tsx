import { View, Pressable, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

type Variant = 'danger' | 'primary';

const THEMES: Record<Variant, {
  iconBg: string;
  iconColor: string;
  btnBg: string;
  btnBgLoading: string;
  confirmText: string;
}> = {
  danger: {
    iconBg: 'bg-red-500/10 dark:bg-red-500/15',
    iconColor: 'text-red-600 dark:text-red-400',
    btnBg: 'bg-red-500 active:opacity-90 dark:bg-red-500',
    btnBgLoading: 'bg-red-500/60 dark:bg-red-500/50',
    confirmText: 'text-white',
  },
  primary: {
    iconBg: 'bg-primary/10 dark:bg-sage-500/15',
    iconColor: 'text-primary dark:text-sage-400',
    btnBg: 'bg-primary active:opacity-90 dark:bg-sage-500',
    btnBgLoading: 'bg-primary/60 dark:bg-sage-500/50',
    confirmText: 'text-primary-foreground',
  },
};

export function ConfirmModal({
  visible,
  icon,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  loadingLabel = 'Memproses...',
  variant = 'danger',
  isLoading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  variant?: Variant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = THEMES[variant];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          disabled={isLoading}
        />
        <View
          style={{ width: '100%', maxWidth: 360 }}
          className="overflow-hidden rounded-3xl bg-white dark:bg-stone-900"
        >
          <View className="items-center gap-3 px-6 pt-6">
            <View className={`size-14 items-center justify-center rounded-full ${theme.iconBg}`}>
              <Icon as={icon} size={26} className={theme.iconColor} />
            </View>
            <View className="items-center gap-1">
              <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
                {title}
              </Text>
              <Text className="text-center font-dm-regular text-xs leading-4 text-muted-foreground dark:text-stone-400">
                {description}
              </Text>
            </View>
          </View>
          <View className="mt-6 flex-row gap-2 border-t border-border/40 bg-muted/30 p-4 dark:border-stone-800/60 dark:bg-stone-800/30">
            <Pressable
              onPress={onCancel}
              disabled={isLoading}
              className="h-11 flex-1 items-center justify-center rounded-full border border-border/60 bg-white active:opacity-80 dark:border-stone-700/60 dark:bg-stone-900"
            >
              <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isLoading}
              className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full ${
                isLoading ? theme.btnBgLoading : theme.btnBg
              }`}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className={`font-dm-bold text-sm ${theme.confirmText}`}>
                    {loadingLabel}
                  </Text>
                </>
              ) : (
                <>
                  <Icon as={icon} size={15} className={theme.confirmText} />
                  <Text className={`font-dm-bold text-sm ${theme.confirmText}`}>
                    {confirmLabel}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}