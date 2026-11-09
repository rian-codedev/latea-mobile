import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Settings, AlertTriangle } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';
import type { User } from '@/lib/stores/session';

export function AvatarDropdown({
  visible,
  onClose,
  user,
  onSettings,
  onLogout,
}: {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  const initial = (user?.name ?? 'K').charAt(0).toUpperCase();
  const hasStore = !!user?.store;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        className="bg-black/20"
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + HEADER_HEIGHT + 8,
            right: 16,
            width: 240,
            opacity: anim,
            transform: [{ translateY }],
          }}
          className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900"
          // eslint-disable-next-line react-native/no-inline-styles
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
                resizeMode="cover"
              />
            ) : (
              <View className="size-9 items-center justify-center rounded-full bg-primary dark:bg-sage-500">
                <Text className="font-dm-extrabold text-xs text-primary-foreground">
                  {initial}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text
                className="font-dm-bold text-sm text-foreground dark:text-stone-50"
                numberOfLines={1}
              >
                {user?.name ?? 'Kasir'}
              </Text>
              {hasStore ? (
                <Text
                  className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400"
                  numberOfLines={1}
                >
                  {user!.store!.name}
                </Text>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Icon
                    as={AlertTriangle}
                    size={9}
                    className="text-amber-600 dark:text-amber-400"
                  />
                  <Text
                    className="font-dm-medium text-[10px] text-amber-600 dark:text-amber-400"
                    numberOfLines={1}
                  >
                    Belum ada toko
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Pengaturan */}
          <Pressable
            onPress={onSettings}
            className="flex-row items-center gap-3 px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40"
            accessibilityRole="button"
            accessibilityLabel="Buka pengaturan"
          >
            <Icon
              as={Settings}
              size={18}
              className="text-foreground dark:text-stone-50"
            />
            <Text className="flex-1 font-dm-semibold text-[13px] text-foreground dark:text-stone-50">
              Pengaturan
            </Text>
          </Pressable>

          <View className="h-px bg-border/40 dark:bg-stone-800/60" />

          {/* Keluar */}
          <Pressable
            onPress={onLogout}
            className="flex-row items-center gap-3 px-4 py-3 active:bg-destructive/5 dark:active:bg-red-500/10"
            accessibilityRole="button"
            accessibilityLabel="Keluar dari aplikasi"
          >
            <Icon
              as={LogOut}
              size={18}
              className="text-destructive dark:text-red-400"
            />
            <Text className="flex-1 font-dm-semibold text-[13px] text-destructive dark:text-red-400">
              Keluar
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}