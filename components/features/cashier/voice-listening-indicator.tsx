import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Mic } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

function WaveDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 400,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.3, {
            duration: 400,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width: 4, height: 4, borderRadius: 2 }, style]}
      className="bg-primary dark:bg-sage-400"
    />
  );
}

export function VoiceListeningIndicator({
  visible,
  bottomOffset = 16,
  rightOffset = 16,
}: {
  visible: boolean;
  bottomOffset?: number;
  rightOffset?: number;
}) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: bottomOffset + 8,
        right: rightOffset + 56 + 12,
      }}
      className="flex-row items-center gap-2 rounded-full border border-border/40 bg-white px-3 py-2 dark:border-stone-800/60 dark:bg-stone-900"
    >
      <Icon
        as={Mic}
        size={12}
        className="text-primary dark:text-sage-400"
      />
      <Text className="font-dm-medium text-[11px] text-foreground dark:text-stone-50">
        Mendengarkan...
      </Text>
      <View className="flex-row items-center gap-1">
        <WaveDot delay={0} />
        <WaveDot delay={150} />
        <WaveDot delay={300} />
      </View>
    </View>
  );
}