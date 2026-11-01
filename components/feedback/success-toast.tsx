import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Check } from 'lucide-react-native';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

export function SuccessToast({ message }: { message: string | null }) {
  const insets = useSafeAreaInsets();
  if (!message) return null;

  return (
    <View
      className="absolute right-5 z-[60]"
      style={{
        top: insets.top + HEADER_HEIGHT + 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
      pointerEvents="none"
    >
      <View className="flex-row items-center gap-2.5 rounded-2xl border border-border/40 bg-white px-3 py-2 dark:border-stone-800/60 dark:bg-stone-900">
        <View className="size-6 items-center justify-center rounded-full bg-primary/10 dark:bg-sage-500/15">
          <Icon as={Check} size={12} className="text-primary dark:text-sage-400" />
        </View>
        <Text
          className="font-dm-medium text-[11px] text-foreground dark:text-stone-50"
          numberOfLines={1}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}