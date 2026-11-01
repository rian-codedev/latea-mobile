import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';

export function LoadingOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message?: string;
}) {
  if (!visible) return null;
  return (
    <View
      style={StyleSheet.absoluteFill}
      className="z-50 items-center justify-center bg-white/80 dark:bg-stone-950/80"
    >
      <View className="items-center gap-3 rounded-2xl border border-border/40 bg-white p-6 dark:border-stone-800/60 dark:bg-stone-900">
        <ActivityIndicator size="large" />
        {message ? (
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}