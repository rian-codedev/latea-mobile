import { useEffect, useState } from 'react';
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
import { Text } from '@/components/ui/text';

type Quality = 'weak' | 'medium' | 'strong' | 'unknown';

/* ── Konfigurasi ── */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://bumpal.annuqayahlatee.id/api/mobile';
const PING_URL = `${API_URL.replace(/\/+$/, '')}/health`;
const PING_INTERVAL = 8000; // ms
const PING_TIMEOUT = 4000; // ms
const STRONG_MS = 300;
const MEDIUM_MS = 1000;
const FAIL_THRESHOLD = 2; // gagal berturut-turut sebelum dianggap "Terbatas"

function qualityFromMs(ms: number): Quality {
  if (ms < STRONG_MS) return 'strong';
  if (ms < MEDIUM_MS) return 'medium';
  return 'weak';
}

/* Format ms agar ringkas: 85, 420, 1.2s */
function formatMs(ms: number | null): string | null {
  if (ms == null) return null;
  if (ms >= 10000) return '>9s';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}`;
}

/* ── Hook: ukur latensi ke server ── */
function useLatencyQuality(enabled: boolean) {
  const [quality, setQuality] = useState<Quality>('unknown');
  const [latency, setLatency] = useState<number | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setQuality('unknown');
      setLatency(null);
      setUnreachable(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failCount = 0;

    const ping = async () => {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), PING_TIMEOUT);
      const start = Date.now();

      try {
        await fetch(PING_URL, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (cancelled) return;
        const ms = Date.now() - start;
        failCount = 0;
        setUnreachable(false);
        setLatency(ms);
        setQuality(qualityFromMs(ms));
      } catch {
        if (cancelled) return;
        failCount += 1;
        setQuality('weak');
        setLatency(null);
        if (failCount >= FAIL_THRESHOLD) setUnreachable(true);
      } finally {
        clearTimeout(abortTimer);
        if (!cancelled) timer = setTimeout(ping, PING_INTERVAL);
      }
    };

    ping();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return { quality, latency, unreachable };
}

/* ── Style per kondisi ── */
const STYLE_OK = {
  bg: 'bg-primary/10 dark:bg-sage-500/15',
  color: 'text-primary dark:text-sage-400',
};
const STYLE_WARN = {
  bg: 'bg-amber-100 dark:bg-amber-950/60',
  color: 'text-amber-700 dark:text-amber-400',
};
const STYLE_ERROR = {
  bg: 'bg-destructive/10 dark:bg-red-500/15',
  color: 'text-destructive dark:text-red-400',
};

/* ── Komponen utama ── */
export function NetworkStatus({
  hideWhenWifi = false,
}: {
  hideWhenWifi?: boolean;
}) {
  const { isConnected, isInternetReachable, type } = useNetInfo();

  const connected = isConnected === true;
  const online = connected && isInternetReachable !== false;

  // Hook harus selalu dipanggil sebelum early return
  const { quality, latency, unreachable } = useLatencyQuality(online);

  // NetInfo belum siap
  if (isConnected === null) return null;

  /* ── Offline: tidak terhubung ke jaringan ── */
  if (!connected) {
    return <StatusBadge icon={WifiOff} label="Offline" {...STYLE_ERROR} />;
  }

  /* ── Terbatas: terhubung tapi server tidak terjangkau ── */
  if (!online || unreachable) {
    return <StatusBadge icon={WifiOff} label="Terbatas" {...STYLE_WARN} />;
  }

  const isWeak = quality === 'weak';
  const style = isWeak ? STYLE_WARN : STYLE_OK;
  const ms = formatMs(latency);

  // Sembunyikan jika WiFi dan kondisi baik
  if (hideWhenWifi && type === 'wifi' && !isWeak) return null;

  /* ── Seluler ── */
  if (type === 'cellular') {
    const icon: LucideIcon =
      quality === 'strong'
        ? SignalHigh
        : quality === 'medium'
        ? SignalMedium
        : quality === 'weak'
        ? SignalLow
        : Signal;

    const label = quality === 'unknown' ? 'Seluler' : `Seluler (${quality})`;

    return <StatusBadge icon={icon} label={label} ms={ms} {...style} />;
  }

  /* ── WiFi ── */
  if (type === 'wifi') {
    const icon: LucideIcon =
      quality === 'strong'
        ? WifiHigh
        : quality === 'weak'
        ? WifiLow
        : Wifi;

    const label = quality === 'unknown' ? 'WiFi' : `WiFi (${quality})`;

    return <StatusBadge icon={icon} label={label} ms={ms} {...style} />;
  }

  /* ── Tipe lain (ethernet, VPN, dll) ── */
  return <StatusBadge icon={Wifi} label="Online" ms={ms} {...style} />;
}

/* ── Internal badge ── */
function StatusBadge({
  icon,
  label,
  bg,
  color,
  ms,
}: {
  icon: LucideIcon;
  label: string;
  bg: string;
  color: string;
  ms?: string | null;
}) {
  return (
    <View
      className={`h-8 w-8 items-center justify-center rounded-full ${bg}`}
      accessibilityRole="image"
      accessibilityLabel={`Status jaringan: ${label}${ms ? `, ${ms} ms` : ''}`}
    >
      <Icon as={icon} size={16} className={color} />

      {ms ? (
        <Text
          numberOfLines={1}
          className={`absolute bottom-0 right-0 font-dm-bold text-[8px] leading-[10px] ${color}`}
          style={{ includeFontPadding: false }}
        >
          {ms}
        </Text>
      ) : null}
    </View>
  );
}