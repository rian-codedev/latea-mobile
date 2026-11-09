import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { GlassHeader } from '@/components/layout/glass-header';
import { DateTimePill } from './date-time-pill';
import { AvatarDropdown } from './avatar-dropdown';
import { NetworkStatus } from '@/components/common/network-status';
import { UserAvatar } from '@/components/common/user-avatar';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { APP_NAME } from '@/lib/constants/app';
import type { User } from '@/lib/stores/session';

const LOGO = require('@/assets/images/logo.png');

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
  const { isTablet } = useResponsive();

  // Logo responsif
  const logoSize = isTablet ? 36 : 32;
  const logoRadius = Math.round(logoSize * 0.25);

  return (
    <>
      <GlassHeader>
        {/* Kiri: logo + nama app */}
        <Image
          source={LOGO}
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoRadius,
          }}
          resizeMode="cover"
          accessibilityLabel={`Logo ${APP_NAME}`}
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
          <UserAvatar
            name={user?.name ?? 'K'}
            uri={user?.avatar_url}
            size={40}
          />
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