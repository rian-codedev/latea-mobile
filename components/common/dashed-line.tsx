import { View } from 'react-native';

export function DashedLine({
  count = 40,
  width = 4,
}: {
  count?: number;
  width?: number;
}) {
  return (
    <View className="flex-row justify-between">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="h-px bg-border dark:bg-stone-700"
          style={{ width }}
        />
      ))}
    </View>
  );
}