import { useState } from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';

export function UserAvatar({
  name,
  uri,
  size = 40,
  className,
}: {
  name: string;
  uri?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;
  const initial = (name || 'K').charAt(0).toUpperCase();
  const fontSize = size * 0.4;

  if (showImage) {
    return (
      <Image
        source={{ uri: uri! }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center border-2 border-white bg-primary dark:border-stone-900 dark:bg-sage-500 ${className ?? ''}`}
    >
      <Text
        className="font-dm-extrabold text-primary-foreground"
        style={{ fontSize }}
      >
        {initial}
      </Text>
    </View>
  );
}