import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Undo2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

export type VoiceUndoToastState = {
  message: string;
  onUndo: () => void;
} | null;

export function VoiceUndoToast({
  state,
  onHide,
  duration = 5000,
}: {
  state: VoiceUndoToastState;
  onHide: () => void;
  duration?: number;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const visible = !!state;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(anim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, anim, onHide, duration]);

  if (!state) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + HEADER_HEIGHT + 16,
        left: 16,
        right: 16,
        zIndex: 998,
        elevation: 998,
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, 0],
            }),
          },
        ],
      }}
    >
      <View
        className="flex-row items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-50 px-3 py-2.5 dark:border-emerald-500/40 dark:bg-emerald-950"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <View className="size-7 items-center justify-center rounded-full bg-emerald-500/15 dark:bg-emerald-500/25">
          <Icon
            as={Check}
            size={14}
            className="text-emerald-700 dark:text-emerald-400"
          />
        </View>
        <Text
          className="flex-1 font-dm-medium text-[12px] leading-4 text-emerald-800 dark:text-emerald-200"
          numberOfLines={2}
        >
          {state.message}
        </Text>
        <Pressable
          onPress={() => {
            state.onUndo();
            onHide();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          className="flex-row items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 active:opacity-80"
        >
          <Icon as={Undo2} size={12} className="text-white" />
          <Text className="font-dm-bold text-[10px] text-white">
            Undo
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}