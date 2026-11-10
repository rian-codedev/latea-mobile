import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Mic, MicOff } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

export type VoiceFabState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'paused';

export function VoiceFab({
  state,
  onPress,
  disabled = false,
  bottomOffset = 16,
  rightOffset = 16,
}: {
  state: VoiceFabState;
  onPress: () => void;
  disabled?: boolean;
  bottomOffset?: number;
  rightOffset?: number;
}) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (state === 'listening') {
      pulseScale.value = withRepeat(
        withTiming(1.4, { duration: 900, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [state, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const isActive = state === 'idle' || state === 'listening';
  const isProcessing = state === 'processing';

  const bgClass = isActive
    ? 'bg-primary dark:bg-sage-500'
    : 'bg-stone-500 dark:bg-stone-700';

  const icon = state === 'paused' ? MicOff : Mic;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        right: rightOffset,
      }}
    >
      {/* Pulse ring saat listening */}
      {state === 'listening' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: 56,
              height: 56,
              borderRadius: 28,
            },
            pulseStyle,
          ]}
          className={bgClass}
        />
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={disabled || isProcessing}
        accessibilityRole="button"
        accessibilityLabel={
          state === 'paused'
            ? 'Aktifkan mikrofon'
            : state === 'listening'
            ? 'Mikrofon sedang mendengarkan'
            : state === 'processing'
            ? 'Memproses perintah'
            : 'Nonaktifkan mikrofon'
        }
        accessibilityState={{ disabled: disabled || isProcessing }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
          opacity: disabled ? 0.5 : 1,
        }}
        className={`items-center justify-center ${bgClass} active:opacity-90`}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Icon
            as={icon}
            size={24}
            className="text-primary-foreground"
          />
        )}
      </Pressable>
    </View>
  );
}