import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { type LucideIcon } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const HEIGHT: Record<Size, number> = {
  sm: 40,
  md: 48,
  lg: 52,
};

const VARIANT_BG: Record<Variant, string> = {
  primary: 'bg-primary dark:bg-sage-500',
  secondary: 'bg-muted dark:bg-stone-800',
  danger: 'bg-destructive dark:bg-red-500',
  ghost: 'bg-transparent',
  outline:
    'bg-white border border-border/60 dark:bg-stone-900 dark:border-stone-700/60',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground dark:text-stone-50',
  danger: 'text-white',
  ghost: 'text-primary dark:text-sage-400',
  outline: 'text-foreground dark:text-stone-50',
};

// Warna spinner mengikuti variant (sebelumnya selalu putih, sehingga
// tidak terlihat di ghost/outline/secondary)
const SPINNER_COLOR: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: '#57534e',
  danger: '#FFFFFF',
  ghost: '#57534e',
  outline: '#57534e',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonProps = {
  label?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
};

export function Button({
  label,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  onPress,
  style,
  children,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const bgClass = isDisabled
    ? 'bg-muted dark:bg-stone-800'
    : VARIANT_BG[variant];

  const textClass = isDisabled
    ? 'text-muted-foreground dark:text-stone-500'
    : VARIANT_TEXT[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    // saat ditekan opacity turun sedikit; saat disabled tetap 0.7
    opacity: isDisabled ? 0.7 : 1 - pressed.value * 0.12,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    pressed.value = withTiming(1, { duration: 80 });
  }, [scale, pressed]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 250 });
    pressed.value = withTiming(0, { duration: 150 });
  }, [scale, pressed]);

  const handlePress = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  }, [haptic, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={4}
      className={`flex-row items-center justify-center rounded-full px-5 ${bgClass} ${
        fullWidth ? 'w-full' : 'shrink-0 grow-0 self-auto'
      }`}
      style={[
        { height: HEIGHT[size], gap: 8 },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={SPINNER_COLOR[variant]}
        />
      ) : (
        <>
          {icon && <Icon as={icon} size={17} className={textClass} />}

          {label ? (
            <Text numberOfLines={1}
              className={`font-dm-bold text-sm ${textClass}`}
            >
              {label}
            </Text>
          ) : null}

          {iconRight && (
            <Icon as={iconRight} size={17} className={textClass} />
          )}

          {children}
        </>
      )}
    </AnimatedPressable>
  );
}