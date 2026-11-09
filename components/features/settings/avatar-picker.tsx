import { useState } from 'react';
import {
  View,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import type { PickedAvatar } from '@/lib/api/account';

export function AvatarPicker({
  currentUri,
  fallbackInitial,
  size = 96,
  onPicked,
}: {
  currentUri?: string | null;
  fallbackInitial: string;
  size?: number;
  onPicked: (file: PickedAvatar | null) => void;
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [failed, setFailed] = useState(false);

  const displayUri = localUri ?? (failed ? null : currentUri);
  const showImage = !!displayUri;

  async function handlePick() {
    if (isPicking) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return;
    }

    setIsPicking(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        setIsPicking(false);
        return;
      }

      // Resize 512×512 + compress quality 0.8 → ~50–150KB
      const manip = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      setLocalUri(manip.uri);
      setFailed(false);
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
      disabled={isPicking}
      accessibilityRole="button"
      accessibilityLabel="Foto profil. Tap untuk mengganti"
      accessibilityHint="Membuka galeri foto"
      className="relative self-center"
    >
      {showImage ? (
        <Image
          source={{ uri: displayUri! }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          className="items-center justify-center rounded-full bg-primary dark:bg-sage-500"
          style={{ width: size, height: size }}
        >
          <Text
            className="font-dm-extrabold text-primary-foreground"
            style={{ fontSize: size * 0.4 }}
          >
            {fallbackInitial}
          </Text>
        </View>
      )}

      {isPicking ? (
        <View
          className="absolute inset-0 items-center justify-center rounded-full bg-black/40"
          style={{ width: size, height: size }}
        >
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : (
        <View className="absolute -bottom-0.5 -right-0.5 size-8 items-center justify-center rounded-full border-2 border-white bg-primary dark:border-stone-900 dark:bg-sage-500">
          <Icon as={Camera} size={14} className="text-primary-foreground" />
        </View>
      )}
    </Pressable>
  );
}