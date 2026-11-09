import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

export function SettingsSection({
  title,
  icon,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      {title ? (
        <View className="flex-row items-center gap-1.5 px-1">
          {icon ? (
            <Icon
              as={icon}
              size={12}
              className="text-muted-foreground dark:text-stone-400"
            />
          ) : null}
          <Text className="font-dm-bold text-[11px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
            {title}
          </Text>
        </View>
      ) : null}
      <View className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
        {children}
      </View>
    </View>
  );
}

export function SettingsDivider() {
  return <View className="ml-16 h-px bg-border/40 dark:bg-stone-800/60" />;
}