// lib/utils/throttle.ts
import { useCallback, useRef } from 'react';

/** Leading-edge throttle: panggilan pertama langsung jalan, sisanya diabaikan selama `ms`. */
export function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms = 700,
) {
  const last = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    (...args: A) => {
      const now = Date.now();
      if (now - last.current < ms) return;
      last.current = now;
      fnRef.current(...args);
    },
    [ms],
  );
}