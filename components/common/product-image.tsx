import { useState } from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';

export function ProductImage({
  uri,
  emoji,
  size = 48,
  rounded = 'xl',
}: {
  uri: string | null;
  emoji: string | null;
  size?: number;
  rounded?: 'lg' | 'xl' | '2xl';
}) {
  const [failed, setFailed] = useState(false);
  const showImage = uri && !failed;

  return (
    <View
      style={{ width: size, height: size }}
      className={`items-center justify-center overflow-hidden rounded-${rounded} border border-border/40 bg-accent/60 dark:border-stone-800/60 dark:bg-stone-800`}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{emoji ?? '📦'}</Text>
      )}
    </View>
  );
}