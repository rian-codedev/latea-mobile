import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Check, X } from 'lucide-react-native';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

export function SuccessToast({
  message,
  variant = 'success',
}: {
  message: string | null;
  variant?: 'success' | 'error';
}) {
  const insets = useSafeAreaInsets();
  if (!message) return null;

  const isError = variant === 'error';
  const IconComponent = isError ? X : Check;

  const badgeClass = isError
    ? 'bg-destructive/10 dark:bg-red-500/15'
    : 'bg-primary/10 dark:bg-sage-500/15';
  const iconClass = isError
    ? 'text-destructive dark:text-red-400'
    : 'text-primary dark:text-sage-400';

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
      <View
        className={`flex-row items-center gap-2.5 rounded-2xl border bg-white px-3 py-2 dark:bg-stone-900 ${
          isError
            ? 'border-destructive/30 dark:border-red-500/30'
            : 'border-border/40 dark:border-stone-800/60'
        }`}
      >
        <View
          className={`size-6 items-center justify-center rounded-full ${badgeClass}`}
        >
          <Icon as={IconComponent} size={12} className={iconClass} />
        </View>
        <Text
          className={`font-dm-medium text-[11px] ${
            isError
              ? 'text-destructive dark:text-red-400'
              : 'text-foreground dark:text-stone-50'
          }`}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}