import { View } from 'react-native';
import { Text } from '@/components/ui/text';

type Tone = 'primary' | 'danger' | 'warning' | 'neutral';

const TONE: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10 dark:bg-sage-500/15', text: 'text-primary dark:text-sage-400' },
  danger:  { bg: 'bg-destructive/10 dark:bg-red-500/15', text: 'text-destructive dark:text-red-400' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400' },
  neutral: { bg: 'bg-muted dark:bg-stone-800', text: 'text-muted-foreground dark:text-stone-400' },
};

export function Badge({
  text,
  tone = 'neutral',
  className,
}: {
  text: string;
  tone?: Tone;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <View className={`self-start rounded-md px-1.5 py-0.5 ${t.bg} ${className ?? ''}`}>
      <Text className={`font-dm-bold text-[10px] ${t.text}`}>{text}</Text>
    </View>
  );
}

export function CountBadge({ count }: { count: number }) {
  return (
    <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 dark:bg-sage-500">
      <Text className="font-dm-bold text-[11px] text-primary-foreground">{count}</Text>
    </View>
  );
}