import { View, Pressable, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { LogOut, RefreshCw } from 'lucide-react-native';
import { GlassHeader } from '@/components/layout/glass-header';
import { DateTimePill } from './date-time-pill';

export function DashboardHeader({
  initial,
  greeting,
  name,
  time,
  fullDate,
  expanded,
  isRefreshing,
  onRefresh,
  onLogout,
}: {
  initial: string;
  greeting: string;
  name: string;
  time: string;
  fullDate: string;
  expanded: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GlassHeader>
      <View className="size-10 items-center justify-center rounded-full bg-primary dark:bg-sage-500">
        <Text className="font-dm-extrabold text-sm text-primary-foreground">
          {initial}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {greeting}
        </Text>
        <Text
          className="font-dm-bold text-base leading-tight text-foreground dark:text-stone-50"
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>

      <DateTimePill time={time} fullDate={fullDate} expanded={expanded} />

      <Pressable
        onPress={onRefresh}
        disabled={isRefreshing}
        hitSlop={8}
        accessibilityLabel="Refresh data"
        className="size-10 items-center justify-center rounded-full active:bg-muted/60 dark:active:bg-stone-800/60"
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={isDark ? '#A3C9A8' : '#84A98C'} />
        ) : (
          <Icon
            as={RefreshCw}
            size={17}
            className="text-muted-foreground dark:text-stone-400"
          />
        )}
      </Pressable>

      <Pressable
        onPress={onLogout}
        hitSlop={8}
        accessibilityLabel="Keluar"
        className="size-10 items-center justify-center rounded-full active:bg-muted/60 dark:active:bg-stone-800/60"
      >
        <Icon
          as={LogOut}
          size={18}
          className="text-muted-foreground dark:text-stone-400"
        />
      </Pressable>
    </GlassHeader>
  );
}