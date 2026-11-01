import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type LucideIcon } from 'lucide-react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const HEIGHT: Record<Size, number> = { sm: 40, md: 48, lg: 52 };

const VARIANT_BG: Record<Variant, string> = {
  primary:   'bg-primary dark:bg-sage-500',
  secondary: 'bg-muted dark:bg-stone-800',
  danger:    'bg-destructive dark:bg-red-500',
  ghost:     'bg-transparent',
  outline:   'bg-white border border-border/60 dark:bg-stone-900 dark:border-stone-700/60',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary:   'text-primary-foreground',
  secondary: 'text-foreground dark:text-stone-50',
  danger:    'text-white',
  ghost:     'text-primary dark:text-sage-400',
  outline:   'text-foreground dark:text-stone-50',
};

export type ButtonProps = {
  label?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function Button({
  label,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  onPress,
  style,
  children,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const bg = isDisabled ? 'bg-muted dark:bg-stone-800' : VARIANT_BG[variant];
  const textColor = isDisabled
    ? 'text-muted-foreground dark:text-stone-500'
    : VARIANT_TEXT[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[{ height: HEIGHT[size] }, fullWidth && { width: '100%' }, style]}
      className={`flex-row items-center justify-center gap-2 rounded-full px-5 active:opacity-90 ${bg}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'danger' ? '#FFFFFF' : '#FFFFFF'} />
      ) : icon ? (
        <Icon as={icon} size={17} className={textColor} />
      ) : null}
      {label ? (
        <Text className={`font-dm-bold text-sm ${textColor}`}>{label}</Text>
      ) : null}
      {iconRight && !loading ? (
        <Icon as={iconRight} size={17} className={textColor} />
      ) : null}
      {children}
    </Pressable>
  );
}