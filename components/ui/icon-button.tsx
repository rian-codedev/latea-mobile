import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

type Variant = 'plain' | 'filled' | 'outline';

const SIZES = { sm: 32, md: 40, lg: 44 } as const;

export function IconButton({
  icon,
  size = 'md',
  variant = 'plain',
  className,
  iconClassName,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  size?: keyof typeof SIZES;
  variant?: Variant;
  className?: string;
  iconClassName?: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const dim = SIZES[size];
  const base =
    variant === 'filled'
      ? 'bg-muted dark:bg-stone-800 active:opacity-70'
      : variant === 'outline'
      ? 'border border-border/60 bg-white dark:border-stone-700/60 dark:bg-stone-900 active:bg-muted/60'
      : 'active:bg-muted/60 dark:active:bg-stone-800/60';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ width: dim, height: dim }}
      className={`items-center justify-center rounded-full ${base} ${className ?? ''}`}
    >
      <Icon
        as={icon}
        size={size === 'sm' ? 14 : 18}
        className={iconClassName ?? 'text-foreground dark:text-stone-50'}
      />
    </Pressable>
  );
}