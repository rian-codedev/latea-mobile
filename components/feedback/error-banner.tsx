import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { AlertCircle } from 'lucide-react-native';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 dark:border-red-400/30 dark:bg-red-500/15">
      <Icon
        as={AlertCircle}
        size={15}
        className="mt-px text-destructive dark:text-red-400"
      />
      <Text className="flex-1 font-dm-regular text-xs leading-4 text-destructive dark:text-red-400">
        {message}
      </Text>
    </View>
  );
}