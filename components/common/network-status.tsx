import { View } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  Wifi,
  WifiOff,
  WifiLow,
  WifiHigh,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

type Quality = 'weak' | 'medium' | 'strong' | 'unknown';

function getQuality(strength: number | null | undefined): Quality {
  if (strength == null) return 'unknown';
  if (strength >= 70) return 'strong';
  if (strength >= 40) return 'medium';
  return 'weak';
}

export function NetworkStatus({
  hideWhenWifi = false,
}: {
  hideWhenWifi?: boolean;
}) {
  const { isConnected, isInternetReachable, type, details } = useNetInfo();

  // NetInfo belum siap
  if (isConnected === null) return null;

  const noInternet = isConnected && isInternetReachable === false;
  const isOnline = isConnected && !noInternet;

  if (hideWhenWifi && isOnline && type === 'wifi') return null;

  /* ── Offline: tidak terhubung ke jaringan ── */
  if (!isConnected) {
    return (
      <StatusBadge
        icon={WifiOff}
        label="Offline"
        bg="bg-destructive/10 dark:bg-red-500/15"
        color="text-destructive dark:text-red-400"
      />
    );
  }

  /* ── Terbatas: terhubung tapi server tidak bisa dijangkau ── */
  if (noInternet) {
    return (
      <StatusBadge
        icon={WifiOff}
        label="Terbatas"
        bg="bg-amber-100 dark:bg-amber-950/60"
        color="text-amber-700 dark:text-amber-400"
      />
    );
  }

  const strength = (details as { strength?: number | null } | null)?.strength;
  const quality = getQuality(strength);

  /* ── WiFi dengan kualitas ── */
  if (type === 'wifi') {
    const icon =
      quality === 'strong'
        ? WifiHigh
        : quality === 'weak'
        ? WifiLow
        : Wifi;

    const isWeak = quality === 'weak';
    const label =
      quality === 'unknown' ? 'WiFi' : `WiFi (${quality})`;

    return (
      <StatusBadge
        icon={icon}
        label={label}
        bg={
          isWeak
            ? 'bg-amber-100 dark:bg-amber-950/60'
            : 'bg-primary/10 dark:bg-sage-500/15'
        }
        color={
          isWeak
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-primary dark:text-sage-400'
        }
      />
    );
  }

  /* ── Seluler dengan kualitas ── */
  if (type === 'cellular') {
    const icon =
      quality === 'strong'
        ? SignalHigh
        : quality === 'medium'
        ? SignalMedium
        : quality === 'weak'
        ? SignalLow
        : Signal;

    const isWeak = quality === 'weak';
    const label =
      quality === 'unknown' ? 'Seluler' : `Seluler (${quality})`;

    return (
      <StatusBadge
        icon={icon}
        label={label}
        bg={
          isWeak
            ? 'bg-amber-100 dark:bg-amber-950/60'
            : 'bg-primary/10 dark:bg-sage-500/15'
        }
        color={
          isWeak
            ? 'text-amber-700 dark:text-amber-400'
            : 'text-primary dark:text-sage-400'
        }
      />
    );
  }

  /* ── Terhubung via tipe lain (ethernet, VPN, dll) ── */
  return (
    <StatusBadge
      icon={Wifi}
      label="Online"
      bg="bg-primary/10 dark:bg-sage-500/15"
      color="text-primary dark:text-sage-400"
    />
  );
}

/* ── Internal badge ── */
function StatusBadge({
  icon,
  label,
  bg,
  color,
}: {
  icon: LucideIcon;
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View
      className={`h-8 w-8 items-center justify-center rounded-full ${bg}`}
      accessibilityRole="image"
      accessibilityLabel={`Status jaringan: ${label}`}
    >
      <Icon as={icon} size={16} className={color} />
    </View>
  );
}