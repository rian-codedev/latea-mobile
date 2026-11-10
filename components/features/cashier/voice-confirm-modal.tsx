import { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Check, Mic, Package, X } from 'lucide-react-native';
import { BaseModal } from '@/components/ui/base-modal';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { formatRupiah } from '@/lib/utils/format';
import type { ApiProduct } from '@/lib/api/product';

const AUTO_EXECUTE_DELAY = 800;

export function VoiceConfirmModal({
  visible,
  product,
  quantity,
  originalText,
  onCancel,
  onConfirm,
  voiceAnswer = null,
  heardText = null,
  listening = false,
}: {
  visible: boolean;
  product: ApiProduct | null;
  quantity: number;
  originalText: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** 'yes' / 'no' — auto-execute setelah delay */
  voiceAnswer?: 'yes' | 'no' | null;
  /** Teks yang didengar dari user (feedback) */
  heardText?: string | null;
  /** Sedang mendengarkan jawaban */
  listening?: boolean;
}) {
  /* ⭐ Auto-execute setelah voiceAnswer terdeteksi */
  useEffect(() => {
    if (!visible || !voiceAnswer) return;

    const timer = setTimeout(() => {
      if (voiceAnswer === 'yes') onConfirm();
      else if (voiceAnswer === 'no') onCancel();
    }, AUTO_EXECUTE_DELAY);

    return () => clearTimeout(timer);
  }, [visible, voiceAnswer, onConfirm, onCancel]);

  if (!product) return null;

  const price = product.discount_price ?? product.price;
  const lineTotal = price * quantity;
  const yesHighlighted = voiceAnswer === 'yes';
  const noHighlighted = voiceAnswer === 'no';

  return (
    <BaseModal
      visible={visible}
      onClose={onCancel}
      align="center"
      maxWidth={380}
    >
      <View className="w-full overflow-hidden rounded-3xl bg-white dark:bg-stone-900">
        {/* Header */}
        <View className="flex-row items-center gap-2.5 border-b border-border/40 px-5 py-4 dark:border-stone-800/60">
          <View className="size-9 items-center justify-center rounded-full bg-primary/10 dark:bg-sage-500/15">
            <Icon
              as={Mic}
              size={16}
              className="text-primary dark:text-sage-400"
            />
          </View>
          <View className="flex-1">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Konfirmasi Perintah
            </Text>
            <View className="flex-row items-center gap-1.5">
              {listening && !voiceAnswer ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#84A98C"
                    style={{ transform: [{ scale: 0.7 }] }}
                  />
                  <Text className="font-dm-regular text-[11px] text-primary dark:text-sage-400">
                    Mendengarkan jawaban...
                  </Text>
                </>
              ) : (
                <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                  {voiceAnswer
                    ? 'Jawaban terdeteksi'
                    : 'Ucapkan "ya" atau "tidak"'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Body */}
        <View className="gap-3 p-5">
          {/* Ucapan user */}
          <View className="rounded-xl bg-muted/40 px-3 py-2 dark:bg-stone-800/40">
            <Text className="font-dm-regular text-[10px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
              Yang Anda ucapkan
            </Text>
            <Text className="mt-0.5 font-dm-medium text-[12px] italic text-foreground dark:text-stone-50">
              "{originalText}"
            </Text>
          </View>

          {/* Produk match */}
          <View className="rounded-xl border border-border/40 bg-white p-3 dark:border-stone-800/60 dark:bg-stone-900">
            <View className="flex-row items-center gap-3">
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                  resizeMode="cover"
                />
              ) : (
                <View className="size-11 items-center justify-center rounded-xl bg-muted dark:bg-stone-800">
                  <Icon
                    as={Package}
                    size={18}
                    className="text-muted-foreground dark:text-stone-500"
                  />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="font-dm-semibold text-[13px] text-foreground dark:text-stone-50"
                  numberOfLines={1}
                >
                  {product.name}
                </Text>
                <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                  {formatRupiah(price)} × {quantity} ={' '}
                  {formatRupiah(lineTotal)}
                </Text>
              </View>
            </View>
          </View>

          {/* Heard text */}
          {heardText ? (
            <View className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 dark:border-sage-500/30 dark:bg-sage-500/10">
              <View className="flex-row items-center gap-1.5">
                <Icon
                  as={Mic}
                  size={11}
                  className="text-primary dark:text-sage-400"
                />
                <Text className="font-dm-regular text-[10px] uppercase tracking-wider text-primary dark:text-sage-400">
                  Anda bilang
                </Text>
              </View>
              <Text className="mt-0.5 font-dm-semibold text-[12px] text-primary dark:text-sage-400">
                "{heardText}"
              </Text>
            </View>
          ) : null}

          <Text className="text-center font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
            Bukan produk ini? Ucapkan "tidak" atau tap Batal.
          </Text>
        </View>

        {/* Footer */}
        <View className="flex-row gap-2 border-t border-border/40 bg-muted/30 p-4 dark:border-stone-800/60 dark:bg-stone-800/30">
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            className={`h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border-2 active:opacity-80 ${
              noHighlighted
                ? 'border-destructive bg-destructive/10 dark:border-red-500 dark:bg-red-500/15'
                : 'border-border/60 bg-white dark:border-stone-700/60 dark:bg-stone-900'
            }`}
          >
            <Icon
              as={X}
              size={14}
              className={
                noHighlighted
                  ? 'text-destructive dark:text-red-400'
                  : 'text-foreground dark:text-stone-50'
              }
            />
            <Text
              className={`font-dm-bold text-sm ${
                noHighlighted
                  ? 'text-destructive dark:text-red-400'
                  : 'text-foreground dark:text-stone-50'
              }`}
            >
              {noHighlighted ? 'Tidak' : 'Batal'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            className={`h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${
              yesHighlighted
                ? 'bg-primary dark:bg-sage-500'
                : 'bg-primary/70 dark:bg-sage-500/70'
            } active:opacity-90`}
          >
            <Icon
              as={Check}
              size={15}
              className="text-primary-foreground"
            />
            <Text className="font-dm-bold text-sm text-primary-foreground">
              {yesHighlighted ? 'Ya, Tambah' : 'Tambah'}
            </Text>
          </Pressable>
        </View>
      </View>
    </BaseModal>
  );
}