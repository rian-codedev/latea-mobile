import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Check, Mic, Package, X } from 'lucide-react-native';
import { BaseModal } from '@/components/ui/base-modal';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { formatRupiah } from '@/lib/utils/format';
import type { MatchedCandidate } from '@/lib/voice';

const AUTO_EXECUTE_DELAY = 800;

export function VoicePickerModal({
  visible,
  candidates,
  quantity,
  originalText,
  onCancel,
  onPick,
  voiceIndex = null,
  heardText = null,
  listening = false,
}: {
  visible: boolean;
  candidates: MatchedCandidate[];
  quantity: number;
  originalText: string;
  onCancel: () => void;
  onPick: (product: MatchedCandidate['product']) => void;
  /** 1-based index → auto-select + auto-confirm setelah delay */
  voiceIndex?: number | null;
  heardText?: string | null;
  listening?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  /* Reset selection saat modal dibuka */
  useEffect(() => {
    if (visible) {
      setSelectedId(candidates[0]?.product.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /* ⭐ Voice index → auto-select candidate */
  useEffect(() => {
    if (!visible || voiceIndex === null) return;
    const idx = voiceIndex - 1;
    if (idx >= 0 && idx < candidates.length) {
      setSelectedId(candidates[idx].product.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceIndex, visible]);

  /* ⭐ Auto-execute setelah voiceIndex terdeteksi */
  useEffect(() => {
    if (!visible || voiceIndex === null) return;
    const idx = voiceIndex - 1;
    if (idx < 0 || idx >= candidates.length) return;

    const timer = setTimeout(() => {
      onPick(candidates[idx].product);
    }, AUTO_EXECUTE_DELAY);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceIndex, visible]);

  const selected = candidates.find((c) => c.product.id === selectedId);
  const highlightedIndex =
    voiceIndex !== null && voiceIndex >= 1 && voiceIndex <= candidates.length
      ? voiceIndex
      : null;

  return (
    <BaseModal
      visible={visible}
      onClose={onCancel}
      align="center"
      maxWidth={400}
    >
      <View className="w-full overflow-hidden rounded-3xl bg-white dark:bg-stone-900">
        {/* Header */}
        <View className="flex-row items-center gap-2.5 border-b border-border/40 px-5 py-4 dark:border-stone-800/60">
          <View className="size-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
            <Icon
              as={Mic}
              size={16}
              className="text-amber-700 dark:text-amber-400"
            />
          </View>
          <View className="flex-1">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Pilih Produk
            </Text>
            <View className="flex-row items-center gap-1.5">
              {listening && voiceIndex === null ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#B45309"
                    style={{ transform: [{ scale: 0.7 }] }}
                  />
                  <Text className="font-dm-regular text-[11px] text-amber-700 dark:text-amber-400">
                    Ucapkan "satu", "dua", atau "tiga"
                  </Text>
                </>
              ) : (
                <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                  {voiceIndex !== null
                    ? 'Pilihan terdeteksi'
                    : 'Ucapkan nomor atau tap produk'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Body */}
        <View className="gap-3 p-5">
          <View className="rounded-xl bg-muted/40 px-3 py-2 dark:bg-stone-800/40">
            <Text className="font-dm-regular text-[10px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
              Yang Anda ucapkan
            </Text>
            <Text className="mt-0.5 font-dm-medium text-[12px] italic text-foreground dark:text-stone-50">
              "{originalText}"
            </Text>
            <Text className="mt-1 font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
              Qty: {quantity}
            </Text>
          </View>

          {/* Heard text */}
          {heardText ? (
            <View className="rounded-xl border border-amber-500/30 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-950/40">
              <View className="flex-row items-center gap-1.5">
                <Icon
                  as={Mic}
                  size={11}
                  className="text-amber-700 dark:text-amber-400"
                />
                <Text className="font-dm-regular text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Anda bilang
                </Text>
              </View>
              <Text className="mt-0.5 font-dm-semibold text-[12px] text-amber-800 dark:text-amber-300">
                "{heardText}"
              </Text>
            </View>
          ) : null}

          <Text className="font-dm-bold text-[11px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
            Pilih yang dimaksud:
          </Text>

          <View className="gap-2">
            {candidates.map((c, i) => {
              const isSelected = c.product.id === selectedId;
              const isVoiceHighlighted = highlightedIndex === i + 1;
              const price = c.product.discount_price ?? c.product.price;
              return (
                <Pressable
                  key={c.product.id}
                  onPress={() => setSelectedId(c.product.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  className={`flex-row items-center gap-3 rounded-xl border-2 p-3 active:opacity-80 ${
                    isVoiceHighlighted
                      ? 'border-primary bg-primary/10 dark:border-sage-500 dark:bg-sage-500/15'
                      : isSelected
                      ? 'border-primary/60 bg-primary/5 dark:border-sage-500/60 dark:bg-sage-500/10'
                      : 'border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900'
                  }`}
                >
                  {/* Nomor urut voice */}
                  <View
                    className={`size-6 shrink-0 items-center justify-center rounded-full ${
                      isVoiceHighlighted || isSelected
                        ? 'bg-primary dark:bg-sage-500'
                        : 'bg-muted dark:bg-stone-800'
                    }`}
                  >
                    <Text
                      className={`font-dm-bold text-[10px] ${
                        isVoiceHighlighted || isSelected
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground dark:text-stone-400'
                      }`}
                    >
                      {i + 1}
                    </Text>
                  </View>

                  {c.product.image_url ? (
                    <Image
                      source={{ uri: c.product.image_url }}
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="size-10 items-center justify-center rounded-lg bg-muted dark:bg-stone-800">
                      <Icon
                        as={Package}
                        size={16}
                        className="text-muted-foreground dark:text-stone-500"
                      />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      className="font-dm-semibold text-[12px] text-foreground dark:text-stone-50"
                      numberOfLines={1}
                    >
                      {c.product.name}
                    </Text>
                    <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                      {formatRupiah(price)}
                    </Text>
                  </View>
                  <View
                    className={`size-5 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-primary bg-primary dark:border-sage-500 dark:bg-sage-500'
                        : 'border-border dark:border-stone-600'
                    }`}
                  >
                    {isSelected ? (
                      <Icon
                        as={Check}
                        size={12}
                        className="text-primary-foreground"
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row gap-2 border-t border-border/40 bg-muted/30 p-4 dark:border-stone-800/60 dark:bg-stone-800/30">
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-border/60 bg-white active:opacity-80 dark:border-stone-700/60 dark:bg-stone-900"
          >
            <Icon
              as={X}
              size={14}
              className="text-foreground dark:text-stone-50"
            />
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Batal
            </Text>
          </Pressable>
          <Pressable
            onPress={() => selected && onPick(selected.product)}
            disabled={!selected}
            accessibilityRole="button"
            className={`h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${
              selected
                ? 'bg-primary active:opacity-90 dark:bg-sage-500'
                : 'bg-muted dark:bg-stone-800'
            }`}
          >
            <Icon
              as={Check}
              size={15}
              className={
                selected
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground dark:text-stone-500'
              }
            />
            <Text
              className={`font-dm-bold text-sm ${
                selected
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground dark:text-stone-500'
              }`}
            >
              Pilih
            </Text>
          </Pressable>
        </View>
      </View>
    </BaseModal>
  );
}