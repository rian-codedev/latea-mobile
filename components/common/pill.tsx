import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

export function Pill({ icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View className="h-8 flex-shrink-0 flex-row items-center gap-1.5 rounded-full border border-border/40 bg-white/70 px-3 dark:border-stone-800/60 dark:bg-stone-900/70">
      <Icon as={icon} size={13} className="text-primary dark:text-sage-400" />
      <Text
        className="font-dm-medium text-xs text-foreground dark:text-stone-50"
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}