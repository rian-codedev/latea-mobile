import { View, Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

type Tone = 'default' | 'warning' | 'danger';

const TONES: Record<
  Tone,
  { iconBg: string; iconColor: string }
> = {
  default: {
    iconBg: 'bg-muted dark:bg-stone-800',
    iconColor: 'text-muted-foreground dark:text-stone-400',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconColor: 'text-amber-700 dark:text-amber-400',
  },
  danger: {
    iconBg: 'bg-destructive/10 dark:bg-red-500/15',
    iconColor: 'text-destructive dark:text-red-400',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'default',
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
}) {
  const t = TONES[tone];

  return (
    <View className="items-center justify-center gap-3 px-4 py-12">
      <View
        className={`size-16 items-center justify-center rounded-full ${t.iconBg}`}
      >
        <Icon as={icon} size={28} className={t.iconColor} />
      </View>

      <View className="items-center gap-1">
        <Text className="text-center font-dm-semibold text-sm text-foreground dark:text-stone-50">
          {title}
        </Text>
        {description ? (
          <Text className="text-center font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            {description}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-2 rounded-full bg-primary px-4 py-2 active:opacity-80 dark:bg-sage-500"
        >
          <Text className="font-dm-bold text-xs text-primary-foreground">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}