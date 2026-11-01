import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

export function StatCard({
  icon,
  label,
  value,
  wide,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View
      className={`min-w-[140px] gap-3 rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900 ${
        wide ? 'w-full' : 'flex-1'
      }`}
    >
      <View className="size-9 items-center justify-center rounded-xl bg-accent/60 dark:bg-stone-800">
        <Icon as={icon} size={17} className="text-primary dark:text-sage-400" />
      </View>
      <View className="gap-0.5">
        <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {label}
        </Text>
        <Text
          className="font-dm-extrabold text-2xl leading-tight tracking-tight text-foreground dark:text-stone-50"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    </View>
  );
}