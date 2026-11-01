import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center gap-1 py-12">
      <Text className="text-3xl">{emoji}</Text>
      <Text className="font-dm-semibold text-sm text-foreground dark:text-stone-50">
        {title}
      </Text>
      {description ? (
        <Text className="text-center font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="mt-2 rounded-full bg-primary px-4 py-2 dark:bg-sage-500"
        >
          <Text className="font-dm-bold text-xs text-primary-foreground">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}