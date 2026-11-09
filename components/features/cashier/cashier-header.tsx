import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ArrowLeft } from 'lucide-react-native';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
import { NetworkStatus } from '@/components/common/network-status';

export function CashierHeader({
  isEditMode,
  isQuickPay = false,
  onBack,
}: {
  isEditMode: boolean;
  isQuickPay?: boolean;
  onBack: () => void;
}) {
  const showQuickBadge = isQuickPay && !isEditMode;

  return (
    <GlassHeader>
      <IconButton
        icon={ArrowLeft}
        onPress={onBack}
        accessibilityLabel="Kembali"
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
            {isEditMode ? 'Edit Transaksi' : 'Kasir'}
          </Text>
          {showQuickBadge ? (
            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 dark:bg-sage-500/15">
              <View className="size-1.5 rounded-full bg-primary dark:bg-sage-400" />
              <Text className="font-dm-bold text-[9px] text-primary dark:text-sage-400">
                Cepat
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {isEditMode
            ? 'Ubah item atau jumlah, lalu simpan'
            : 'Tap produk untuk menambah ke keranjang'}
        </Text>
      </View>
      <NetworkStatus />
    </GlassHeader>
  );
}