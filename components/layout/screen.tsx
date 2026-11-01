import { View } from 'react-native';
import { type ReactNode } from 'react';

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={`flex-1 bg-white dark:bg-stone-950 ${className ?? ''}`}>
      {children}
    </View>
  );
}