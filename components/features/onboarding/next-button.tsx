import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowRight } from 'lucide-react-native';

export function NextButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  }
  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 rounded-full bg-primary/90 px-8 dark:bg-sage-500/90"
        style={{
          height: 52,
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        <Text className="font-dm-bold text-sm text-primary-foreground">{label}</Text>
        <Icon as={ArrowRight} size={16} className="text-primary-foreground" />
      </Pressable>
    </Animated.View>
  );
}