import * as Speech from 'expo-speech';
import { usePreferences } from '@/lib/stores/preferences';

const LANG = 'id-ID';
const PITCH = 1.0;

/**
 * Speak text with user-selected voice + rate.
 * `onDone` dipanggil setelah TTS selesai / error / stopped.
 */
export function speak(text: string, onDone?: () => void): void {
  if (!text) {
    onDone?.();
    return;
  }

  try {
    const prefs = usePreferences.getState();
    const voiceId = prefs.ttsVoiceId;
    const rate = Math.max(0.5, Math.min(2.0, prefs.ttsRate || 1.0));

    Speech.stop();
    Speech.speak(text, {
      language: LANG,
      rate,
      pitch: PITCH,
      ...(voiceId ? { voice: voiceId } : {}),
      onDone: () => onDone?.(),
      onError: () => onDone?.(),
      onStopped: () => onDone?.(),
    });
  } catch (e) {
    if (__DEV__) console.warn('[TTS] speak error:', e);
    onDone?.();
  }
}

/** Speak sample text langsung tanpa baca preferences (untuk preview di picker). */
export function speakPreview(
  text: string,
  voiceId: string | null,
  rate: number,
): void {
  if (!text) return;
  try {
    Speech.stop();
    Speech.speak(text, {
      language: LANG,
      rate: Math.max(0.5, Math.min(2.0, rate)),
      pitch: PITCH,
      ...(voiceId ? { voice: voiceId } : {}),
    });
  } catch (e) {
    if (__DEV__) console.warn('[TTS] preview error:', e);
  }
}

export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}

/** Load voices — return only Indonesian (id-*). */
export async function getIndonesianVoices(): Promise<Speech.Voice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.filter((v) => {
      const lang = (v.language ?? '').toLowerCase();
      return lang.startsWith('id');
    });
  } catch {
    return [];
  }
}

export function formatAddFeedback(
  productName: string,
  quantity: number,
): string {
  return `${productName} ${numberToSpokenIndonesian(quantity)} ditambahkan`;
}

export function formatPickerFeedback(count: number): string {
  if (count === 1) return 'Tolong pilih produk';
  return `Tolong pilih, ada ${numberToSpokenIndonesian(count)} produk`;
}

function numberToSpokenIndonesian(n: number): string {
  const KATA: Record<number, string> = {
    1: 'satu',
    2: 'dua',
    3: 'tiga',
    4: 'empat',
    5: 'lima',
    6: 'enam',
    7: 'tujuh',
    8: 'delapan',
    9: 'sembilan',
    10: 'sepuluh',
    11: 'sebelas',
    12: 'dua belas',
    13: 'tiga belas',
    14: 'empat belas',
    15: 'lima belas',
    16: 'enam belas',
    17: 'tujuh belas',
    18: 'delapan belas',
    19: 'sembilan belas',
    20: 'dua puluh',
  };
  return KATA[n] ?? String(n);
}