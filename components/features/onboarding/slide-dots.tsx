import { View, Pressable } from 'react-native';

export function SlideDots({
  count,
  activeIndex,
  onDotPress,
}: {
  count: number;
  activeIndex: number;
  onDotPress: (index: number) => void;
}) {
  return (
    <View className="flex-row justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Pressable
          key={i}
          onPress={() => onDotPress(i)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Ke slide ${i + 1}`}
        >
          <View
            className={`h-1.5 rounded-full ${
              i === activeIndex
                ? 'w-5 bg-primary dark:bg-sage-400'
                : 'w-1.5 bg-foreground/15 dark:bg-stone-100/15'
            }`}
          />
        </Pressable>
      ))}
    </View>
  );
}