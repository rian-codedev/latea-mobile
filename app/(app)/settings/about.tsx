import { ScrollView, View, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import {
  ArrowLeft,
  Package,
  Building2,
  Code2,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/layout/screen';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { APP_NAME, APP_TAGLINE, APP_ORG, ROUTES } from '@/lib/constants/app';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

const LOGO = require('@/assets/images/logo.png');

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const runtimeVersion = Constants.expoConfig?.runtimeVersion ?? '-';

  // Logo responsif — prominent tapi tidak overwhelming
  const logoSize = isTablet ? 128 : 96;
  const logoRadius = Math.round(logoSize * 0.25);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
          gap: 20,
        }}
      >
        <View className="items-center gap-2 py-6">
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
          <Text className="mt-3 font-dm-extrabold text-2xl tracking-tight text-foreground dark:text-stone-50">
            {APP_NAME}
          </Text>
          <Text className="font-dm-regular text-sm text-muted-foreground dark:text-stone-400">
            {APP_TAGLINE}
          </Text>
        </View>

        <View className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
          <InfoItem icon={Package} label="Versi Aplikasi" value={version} />
          <Divider />
          <InfoItem
            icon={Code2}
            label="Runtime"
            value={String(runtimeVersion)}
          />
          <Divider />
          <InfoItem icon={Building2} label="Penyelenggara" value={APP_ORG} />
        </View>

        <Text className="text-center font-dm-regular text-[11px] leading-4 text-muted-foreground dark:text-stone-500">
          © {new Date().getFullYear()} {APP_ORG}
          {'\n'}Aplikasi kasir untuk pengelolaan penjualan.
        </Text>
      </ScrollView>

      <GlassHeader>
        <IconButton
          icon={ArrowLeft}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace(ROUTES.settings)
          }
          accessibilityLabel="Kembali"
        />
        <View className="flex-1">
          <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
            Tentang
          </Text>
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Info aplikasi & penyelenggara
          </Text>
        </View>
      </GlassHeader>
    </Screen>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="size-8 items-center justify-center rounded-lg bg-accent/60 dark:bg-stone-800">
        <Icon as={icon} size={14} className="text-primary dark:text-sage-400" />
      </View>
      <View className="flex-1">
        <Text className="font-dm-regular text-[10px] uppercase tracking-wide text-muted-foreground dark:text-stone-400">
          {label}
        </Text>
        <Text
          className="mt-0.5 font-dm-semibold text-[13px] text-foreground dark:text-stone-50"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="ml-16 h-px bg-border/40 dark:bg-stone-800/60" />;
}