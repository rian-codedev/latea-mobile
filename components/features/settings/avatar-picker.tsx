import { useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { UserAvatar } from '@/components/common/user-avatar';
import type { PickedAvatar } from '@/lib/api/account';

export function AvatarPicker({
  currentUri,
  fallbackInitial,
  size = 96,
  disabled = false,
  onPicked,
}: {
  currentUri?: string | null;
  fallbackInitial: string;
  size?: number;
  disabled?: boolean;
  onPicked: (file: PickedAvatar | null) => void;
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const displayUri = localUri ?? currentUri;
  const badgeSize = Math.max(28, Math.round(size * 0.28));

  async function handlePick() {
    if (isPicking || disabled) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    setIsPicking(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        setIsPicking(false);
        return;
      }

      const manip = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      setLocalUri(manip.uri);
      onPicked({
        uri: manip.uri,
        name: `avatar-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    } catch (e) {
      console.warn('[AvatarPicker] failed:', e);
    } finally {
      setIsPicking(false);
    }
  }

  return (
    <Pressable
      onPress={handlePick}
      disabled={isPicking || disabled}
      accessibilityRole="button"
      accessibilityLabel="Foto profil. Tap untuk mengganti"
      accessibilityHint="Membuka galeri foto"
      // Padding 6px memberi ruang badge di luar lingkaran avatar
      style={{ padding: 6 }}
      className="self-center"
    >
      <View style={{ width: size, height: size }}>
        <UserAvatar
          name={fallbackInitial}
          uri={displayUri}
          size={size}
          showRing={false} // ⭐ no ring — biar ukuran visual full size
        />

        {isPicking ? (
          <View
            style={{
              position: 'absolute',
              inset: 0,
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
            className="items-center justify-center bg-black/40"
          >
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : (
          // Badge posisinya clean di luar, tidak memotong avatar
          <View
            style={{
              position: 'absolute',
              width: badgeSize,
              height: badgeSize,
              bottom: -6,
              right: -6,
              borderRadius: badgeSize / 2,
              borderWidth: 3,
            }}
            className="items-center justify-center border-white bg-primary dark:border-stone-900 dark:bg-sage-500"
          >
            <Icon
              as={Camera}
              size={Math.round(badgeSize * 0.45)}
              className="text-primary-foreground"
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}