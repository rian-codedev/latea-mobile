import { useState } from 'react';
import { View, Image } from 'react-native';
import { Package } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

const RADIUS: Record<'lg' | 'xl' | '2xl', string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export function ProductImage({
  uri,
  size = 48,
  rounded = 'xl',
}: {
  uri: string | null;
  size?: number;
  rounded?: 'lg' | 'xl' | '2xl';
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;
  const iconSize = Math.round(size * 0.45);

  return (
    <View
      style={{ width: size, height: size }}
      className={`items-center justify-center overflow-hidden ${RADIUS[rounded]} border border-border/40 bg-accent/60 dark:border-stone-800/60 dark:bg-stone-800`}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon
          as={Package}
          size={iconSize}
          className="text-muted-foreground/50 dark:text-stone-500"
        />
      )}
    </View>
  );
}