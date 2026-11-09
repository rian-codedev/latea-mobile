import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { GlassHeader } from '@/components/layout/glass-header';
import { DateTimePill } from './date-time-pill';
import { AvatarDropdown } from './avatar-dropdown';
import { NetworkStatus } from '@/components/common/network-status';
import { APP_NAME } from '@/lib/constants/app';
import type { User } from '@/lib/stores/session';

const LOGO = require('@/assets/images/icon.png');

export function DashboardHeader({
  user,
  time,
  fullDate,
  expanded,
  onSettings,
  onLogout,
}: {
  user: User | null;
  time: string;
  fullDate: string;
  expanded: boolean;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initial = (user?.name ?? 'K').charAt(0).toUpperCase();

  return (
    <>
      <GlassHeader>
        {/* Kiri: logo + nama app */}
        <Image
          source={LOGO}
          style={{ width: 24, height: 24, borderRadius: 6 }}
          resizeMode="cover"
        />
        <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
          {APP_NAME}
        </Text>

        <View className="flex-1" />

        {/* Kanan: network + jam + avatar */}
        <NetworkStatus />
        <DateTimePill time={time} fullDate={fullDate} expanded={expanded} />

        <Pressable
          onPress={() => setDropdownOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Menu pengguna. Tap untuk membuka"
          hitSlop={8}
          className="active:opacity-70"
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
          ) : (
            <View className="size-10 items-center justify-center rounded-full bg-primary dark:bg-sage-500">
              <Text className="font-dm-extrabold text-sm text-primary-foreground">
                {initial}
              </Text>
            </View>
          )}
        </Pressable>
      </GlassHeader>

      <AvatarDropdown
        visible={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
        user={user}
        onSettings={() => {
          setDropdownOpen(false);
          onSettings();
        }}
        onLogout={() => {
          setDropdownOpen(false);
          onLogout();
        }}
      />
    </>
  );
}