import { useState } from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';

export function UserAvatar({
  name,
  uri,
  size = 40,
  showRing = true,
  className,
}: {
  name: string;
  uri?: string | null;
  size?: number;
  /** Border ring 2px — default ON untuk header/dropdown, OFF untuk picker */
  showRing?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;
  const initial = (name || 'K').charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.42);

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
      className={`items-center justify-center bg-primary dark:bg-sage-500 ${
        showRing ? 'border-2 border-white dark:border-stone-900' : ''
      } ${className ?? ''}`}
    >
      <Text
        className="font-dm-extrabold text-primary-foreground"
        style={{
          fontSize,
          lineHeight: fontSize,
          includeFontPadding: false, // ⭐ fix Android text clipping
          textAlignVertical: 'center',
        }}
      >
        {initial}
      </Text>
    </View>
  );
}