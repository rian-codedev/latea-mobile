import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ArrowLeft } from 'lucide-react-native';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
import { NetworkStatus } from '@/components/common/network-status';

export function CashierHeader({
  isEditMode,
  onBack,
}: {
  isEditMode: boolean;
  onBack: () => void;
}) {
  return (
    <GlassHeader>
      <IconButton
        icon={ArrowLeft}
        onPress={onBack}
        accessibilityLabel="Kembali"
      />
      <View className="flex-1">
        <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
          {isEditMode ? 'Edit Transaksi' : 'Kasir'}
        </Text>
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