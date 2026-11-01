import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Clock } from 'lucide-react-native';

export function DateTimePill({
  time,
  fullDate,
  expanded,
}: {
  time: string;
  fullDate: string;
  expanded: boolean;
}) {
  if (!expanded) {
    return (
      <View className="flex-row items-center gap-1.5 rounded-full border border-border/40 bg-white/70 px-2.5 py-1.5 dark:border-stone-800/60 dark:bg-stone-900/70">
        <View className="size-1.5 rounded-full bg-primary dark:bg-sage-400" />
        <Text className="font-mono text-[11px] font-bold tracking-tight text-foreground dark:text-stone-50">
          {time}
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-2 rounded-full border border-border/40 bg-white/70 px-3 py-1.5 dark:border-stone-800/60 dark:bg-stone-900/70">
      <Icon as={Clock} size={11} className="text-primary dark:text-sage-400" />
      <Text className="font-mono text-[11px] font-bold tracking-tight text-foreground dark:text-stone-50">
        {time}
      </Text>
      <View className="h-3 w-px bg-border/60 dark:bg-stone-700/60" />
      <Text className="font-dm-medium text-[10.5px] text-muted-foreground dark:text-stone-400">
        {fullDate}
      </Text>
    </View>
  );
}