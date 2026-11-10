import { Pressable, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

export function SettingsRow({
  icon,
  label,
  description,
  right,
  onPress,
  danger,
  beta,
}: {
  icon?: LucideIcon;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  beta?: boolean;
}) {
  const content = (
    <>
      {icon ? (
        <View
          className={`size-9 items-center justify-center rounded-xl ${
            danger
              ? 'bg-destructive/10 dark:bg-red-500/15'
              : 'bg-accent/60 dark:bg-stone-800'
          }`}
        >
          <Icon
            as={icon}
            size={16}
            className={
              danger
                ? 'text-destructive dark:text-red-400'
                : 'text-primary dark:text-sage-400'
            }
          />
        </View>
      ) : null}
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className={`font-dm-semibold text-[13px] ${
              danger
                ? 'text-destructive dark:text-red-400'
                : 'text-foreground dark:text-stone-50'
            }`}
          >
            {label}
          </Text>
          {beta ? (
            <View className="rounded-full bg-amber-100 px-1.5 py-px dark:bg-amber-950/60">
              <Text className="font-dm-bold text-[8px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Beta
              </Text>
            </View>
          ) : null}
        </View>
        {description ? (
          <Text className="mt-0.5 font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
            {description}
          </Text>
        ) : null}
      </View>
      {right ?? null}
      {onPress && right === undefined ? (
        <Icon
          as={ChevronRight}
          size={16}
          className="text-muted-foreground/60 dark:text-stone-500/60"
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3">{content}</View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40"
    >
      {content}
    </Pressable>
  );
}