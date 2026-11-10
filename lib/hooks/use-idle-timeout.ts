import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export const DEFAULT_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 jam

/**
 * Idle timeout hook.
 *
 * Menghitung total waktu idle (foreground + background).
 * Reset via `bumpActivity()` pada setiap interaksi user.
 *
 * @example
 * const { bumpActivity } = useIdleTimeout({
 *   enabled: !!user,
 *   onTimeout: expireIdle,
 * });
 *
 * // Wrapper root View:
 * <View onStartShouldSetResponderCapture={() => { bumpActivity(); return false; }}>
 */
export function useIdleTimeout({
  enabled,
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  onTimeout,
}: {
  enabled: boolean;
  timeoutMs?: number;
  onTimeout: () => void;
}) {
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleTimeout = useCallback(() => {
    clearTimer();
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = timeoutMs - elapsed;

    if (remaining <= 0) {
      onTimeoutRef.current();
      return;
    }

    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, remaining);
  }, [timeoutMs, clearTimer]);

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    scheduleTimeout();
  }, [scheduleTimeout]);

  /* Start/stop timer saat `enabled` berubah */
  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    lastActivityRef.current = Date.now();
    scheduleTimeout();

    return clearTimer;
  }, [enabled, scheduleTimeout, clearTimer]);

  /* Hitung idle saat app background/inactive → active */
  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'background' || state === 'inactive') {
          clearTimer();
        } else if (state === 'active') {
          const totalIdle = Date.now() - lastActivityRef.current;

          if (totalIdle >= timeoutMs) {
            onTimeoutRef.current();
            return;
          }

          lastActivityRef.current = Date.now();
          scheduleTimeout();
        }
      },
    );

    return () => sub.remove();
  }, [enabled, timeoutMs, scheduleTimeout, clearTimer]);

  return { bumpActivity };
}