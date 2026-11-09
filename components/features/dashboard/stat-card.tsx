import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

type Tone = 'green' | 'blue' | 'amber';

const TONES: Record<
  Tone,
  { iconBg: string; iconColor: string }
> = {
  green: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
  },
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-700 dark:text-blue-400',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconColor: 'text-amber-700 dark:text-amber-400',
  },
};

export function StatCard({
  icon,
  label,
  value,
  tone = 'green',
  wide = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: Tone;
  wide?: boolean;
}) {
  const t = TONES[tone];

  if (wide) {
    return (
      <View className="w-full overflow-hidden rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900">
        <View className="flex-row items-center gap-4">
          <View
            className={`size-12 items-center justify-center rounded-2xl ${t.iconBg}`}
          >
            <Icon as={icon} size={22} className={t.iconColor} />
          </View>
          <View className="flex-1">
            <Text className="font-dm-medium text-[10.5px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
              {label}
            </Text>
            <Text
              className="mt-1 font-dm-extrabold text-2xl leading-tight tracking-tight text-foreground dark:text-stone-50"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {value}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="min-w-[140px] flex-1 overflow-hidden rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900">
      <View className="gap-3">
        <View
          className={`size-10 items-center justify-center rounded-xl ${t.iconBg}`}
        >
          <Icon as={icon} size={18} className={t.iconColor} />
        </View>
        <View>
          <Text className="font-dm-medium text-[10.5px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
            {label}
          </Text>
          <Text
            className="mt-0.5 font-dm-extrabold text-2xl leading-tight tracking-tight text-foreground dark:text-stone-50"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}