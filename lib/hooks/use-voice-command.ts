import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  type AppStateStatus,
} from 'react-native';
import type { ApiProduct } from '@/lib/api/product';
import { useCart } from '@/lib/stores/cart';
import { processVoiceCommand } from '@/lib/voice';
import type { VoiceParseResult } from '@/lib/voice/types';
import {
  parseConfirmAnswer,
  parsePickerAnswer,
} from '@/lib/voice/answer-parser';
import {
  formatAddFeedback,
  formatPickerFeedback,
  speak,
} from '@/lib/voice/tts';
import {
  voiceService,
  type VoiceServiceState,
} from '@/lib/voice/voice-service';

export type VoiceMode =
  | { kind: 'command' }
  | { kind: 'confirm' }
  | { kind: 'picker'; count: number };

type NoMatchListener = (reason: string, originalText: string) => void;

const MODAL_ANSWER_TIMEOUT_MS = 12000;
const TTS_SAFETY_TIMEOUT_MS = 8000;
const TTS_ECHO_GUARD_MS = 300;

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Izin Mikrofon',
        message:
          'Aplikasi memerlukan akses mikrofon untuk voice command.',
        buttonPositive: 'Izinkan',
        buttonNegative: 'Batal',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function useVoiceCommand({
  products,
  enabled,
  ttsEnabled,
  autoPauseSeconds,
  onNoMatch,
}: {
  products: ApiProduct[];
  enabled: boolean;
  ttsEnabled: boolean;
  autoPauseSeconds: number;
  onNoMatch?: NoMatchListener;
}) {
  const [state, setState] = useState<VoiceServiceState>('idle');
  const [mode, setMode] = useState<VoiceMode>({ kind: 'command' });
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const [pendingConfirm, setPendingConfirm] = useState<
    Extract<VoiceParseResult, { kind: 'confirm' }> | null
  >(null);
  const [pendingPicker, setPendingPicker] = useState<
    Extract<VoiceParseResult, { kind: 'picker' }> | null
  >(null);
  const [heardText, setHeardText] = useState<string | null>(null);
  const [confirmAnswer, setConfirmAnswer] = useState<'yes' | 'no' | null>(
    null,
  );
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [answerListeningTimeout, setAnswerListeningTimeout] =
    useState(false);

  const [undoState, setUndoState] = useState<{
    message: string;
    onUndo: () => void;
  } | null>(null);

  /* Refs */
  const modeRef = useRef<VoiceMode>(mode);
  modeRef.current = mode;

  const productsRef = useRef(products);
  productsRef.current = products;

  const ttsEnabledRef = useRef(ttsEnabled);
  ttsEnabledRef.current = ttsEnabled;

  const onNoMatchRef = useRef(onNoMatch);
  onNoMatchRef.current = onNoMatch;

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPauseSecondsRef = useRef(autoPauseSeconds);
  autoPauseSecondsRef.current = autoPauseSeconds;

  const ttsEndedAtRef = useRef(0);

  const addItem = useCart((s) => s.addItem);
  const decrement = useCart((s) => s.decrement);
  const removeItem = useCart((s) => s.removeItem);
  const itemsRef = useRef(useCart.getState().items);
  useEffect(() => {
    return useCart.subscribe((s) => {
      itemsRef.current = s.items;
    });
  }, []);

  /* ── Idle timer (pause mic after N seconds no activity) ── */
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    const secs = autoPauseSecondsRef.current;
    if (secs <= 0) return;
    idleTimerRef.current = setTimeout(() => {
      void voiceService.pause();
      if (ttsEnabledRef.current) speak('Mikrofon nonaktif');
    }, secs * 1000);
  }, []);

  /**
   * ⭐ FIX: Pause mic → speak → resume DENGAN SAFETY TIMER.
   * Kalau onDone tidak fire (bug HP, notifikasi, dsb), 
   * setelah TTS_SAFETY_TIMEOUT_MS tetap resume.
   */
  const speakAndResume = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;

    void voiceService.pause();

    let resumed = false;
    const doResume = () => {
      if (resumed) return;
      resumed = true;
      clearTimeout(safetyTimer);
      ttsEndedAtRef.current = Date.now();
      setTimeout(() => {
        if (voiceService.state === 'paused') {
          void voiceService.resume();
        }
      }, TTS_ECHO_GUARD_MS);
    };

    const safetyTimer = setTimeout(doResume, TTS_SAFETY_TIMEOUT_MS);

    speak(text, doResume);
  }, []);

  const addProductWithUndo = useCallback(
    (product: ApiProduct, quantity: number) => {
      const before = itemsRef.current.find(
        (i) => i.productId === product.id,
      );
      const beforeQty = before?.quantity ?? 0;

      for (let i = 0; i < quantity; i++) {
        addItem({
          productId: product.id,
          name: product.name,
          code: product.code,
          emoji: product.emoji ?? '📦',
          imageUrl: product.image_url,
          price: product.price,
          discountPrice: product.discount_price,
          minimalDiscount: product.minimal_discount,
        });
      }

      speakAndResume(formatAddFeedback(product.name, quantity));

      setUndoState({
        message: `${product.name} × ${quantity} ditambahkan`,
        onUndo: () => {
          const current = itemsRef.current.find(
            (i) => i.productId === product.id,
          );
          const currentQty = current?.quantity ?? 0;
          const diff = currentQty - beforeQty;
          if (diff <= 0) return;
          if (beforeQty === 0) {
            removeItem(product.id);
          } else {
            for (let i = 0; i < diff; i++) decrement(product.id);
          }
        },
      });
    },
    [addItem, decrement, removeItem, speakAndResume],
  );

  const handleResult = useCallback(
    (rawText: string) => {
      /* ⭐ Echo guard: kalau ini dalam 500ms setelah TTS, abaikan */
      if (
        ttsEndedAtRef.current > 0 &&
        Date.now() - ttsEndedAtRef.current < TTS_ECHO_GUARD_MS + 200
      ) {
        if (__DEV__) {
          console.log('[Voice] ignore (echo guard):', rawText);
        }
        return;
      }

      setHeardText(rawText);
      resetIdleTimer();

      const currentMode = modeRef.current;

      if (currentMode.kind === 'confirm') {
        const answer = parseConfirmAnswer(rawText);
        if (answer === 'yes' || answer === 'no') {
          setConfirmAnswer(answer);
        }
        return;
      }

      if (currentMode.kind === 'picker') {
        const answer = parsePickerAnswer(rawText, currentMode.count);
        if (!answer) return;
        if (answer.kind === 'cancel') {
          setPendingPicker(null);
          setPickerIndex(null);
          setHeardText(null);
          setMode({ kind: 'command' });
          speakAndResume('Dibatalkan');
          return;
        }
        setPickerIndex(answer.value);
        return;
      }

      /* ── Command mode ── */
      const result = processVoiceCommand(
        rawText,
        productsRef.current,
      );

      if (result.kind === 'auto-add') {
        addProductWithUndo(result.product, result.quantity);
        return;
      }

      if (result.kind === 'confirm') {
        setPendingConfirm(result);
        setMode({ kind: 'confirm' });
        setAnswerListeningTimeout(false);
        speakAndResume('Konfirmasi, ya atau tidak?');
        return;
      }

      if (result.kind === 'picker') {
        setPendingPicker(result);
        setMode({ kind: 'picker', count: result.candidates.length });
        setAnswerListeningTimeout(false);
        speakAndResume(formatPickerFeedback(result.candidates.length));
        return;
      }

      /* ── No match — SILENT (user pilihan B) ── */
      if (__DEV__) {
        console.log('[Voice] no match:', result.reason, result.normalized);
      }
      onNoMatchRef.current?.(result.reason, rawText);
    },
    [addProductWithUndo, resetIdleTimer, speakAndResume],
  );

  /* ── Confirm handlers ── */
  const handleConfirmYes = useCallback(() => {
    if (!pendingConfirm) return;
    addProductWithUndo(pendingConfirm.product, pendingConfirm.quantity);
    setPendingConfirm(null);
    setConfirmAnswer(null);
    setHeardText(null);
    setMode({ kind: 'command' });
  }, [pendingConfirm, addProductWithUndo]);

  const handleConfirmNo = useCallback(() => {
    setPendingConfirm(null);
    setConfirmAnswer(null);
    setHeardText(null);
    setMode({ kind: 'command' });
    speakAndResume('Dibatalkan');
  }, [speakAndResume]);

  /* ── Picker handlers ── */
  const handlePick = useCallback(
    (product: ApiProduct) => {
      if (!pendingPicker) return;
      addProductWithUndo(product, pendingPicker.quantity);
      setPendingPicker(null);
      setPickerIndex(null);
      setHeardText(null);
      setMode({ kind: 'command' });
    },
    [pendingPicker, addProductWithUndo],
  );

  const handleCancelPick = useCallback(() => {
    setPendingPicker(null);
    setPickerIndex(null);
    setHeardText(null);
    setMode({ kind: 'command' });
    speakAndResume('Dibatalkan');
  }, [speakAndResume]);

  /* ── Wire events ── */
  useEffect(() => {
    const unsubState = voiceService.subscribeState(setState);
    const unsubResult = voiceService.subscribeResult(handleResult);
    const unsubError = voiceService.subscribeError((code) => {
      if (__DEV__) console.warn('[Voice] error:', code);
    });

    return () => {
      unsubState();
      unsubResult();
      unsubError();
    };
  }, [handleResult]);

  /* ── Auto-start/stop ── */
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!enabled) {
        await voiceService.stop();
        return;
      }

      const granted = await requestMicPermission();
      if (cancelled) return;
      if (!granted) {
        setIsAvailable(false);
        return;
      }

      const available = await checkAvailability();
      if (cancelled) return;
      setIsAvailable(available);
      if (!available) return;

      await voiceService.start();
      resetIdleTimer();
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [enabled, resetIdleTimer]);

  /* ⭐ Modal answer auto-pause after timeout */
  useEffect(() => {
    if (!(pendingConfirm || pendingPicker)) {
      setAnswerListeningTimeout(false);
      return;
    }

    setAnswerListeningTimeout(false);

    const timer = setTimeout(() => {
      setAnswerListeningTimeout(true);
      void voiceService.pause();
      if (__DEV__) {
        console.log('[Voice] modal answer timeout — mic paused');
      }
    }, MODAL_ANSWER_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [pendingConfirm, pendingPicker]);

  /* ── Background pause/resume ── */
  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'background' || state === 'inactive') {
          void voiceService.pause();
        } else if (state === 'active') {
          if (voiceService.state === 'paused') {
            void voiceService.resume();
          }
        }
      },
    );
    return () => sub.remove();
  }, [enabled]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      void voiceService.stop();
    };
  }, []);

  /* ── Manual toggle (FAB) ── */
  const toggle = useCallback(async () => {
    if (state === 'paused') {
      await voiceService.resume();
      resetIdleTimer();
      if (ttsEnabledRef.current) speak('Mikrofon aktif');
    } else {
      await voiceService.pause();
      if (ttsEnabledRef.current) speak('Mikrofon nonaktif');
    }
  }, [state, resetIdleTimer]);

  return {
    state,
    isAvailable,
    mode: mode.kind,
    pendingConfirm,
    pendingPicker,
    heardText,
    confirmAnswer,
    pickerIndex,
    answerListeningTimeout,
    undoState,
    clearUndo: () => setUndoState(null),
    toggle,
    handleConfirmYes,
    handleConfirmNo,
    handlePick,
    handleCancelPick,
  };
}

async function checkAvailability(): Promise<boolean> {
  try {
    const { ExpoSpeechRecognitionModule } = await import(
      'expo-speech-recognition'
    );
    const services =
      ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
    const recognitionServices = services.filter(
      (s) => s !== 'com.google.android.tts',
    );
    return recognitionServices.length > 0;
  } catch {
    return false;
  }
}