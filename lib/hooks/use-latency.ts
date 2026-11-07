// hooks/use-latency.ts
import { useEffect, useRef, useState } from 'react';

type Quality = 'weak' | 'medium' | 'strong' | 'unknown';

const INTERVAL = 8000;
const TIMEOUT = 4000;

function qualityFromMs(ms: number): Quality {
  if (ms < 300) return 'strong';
  if (ms < 1000) return 'medium';
  return 'weak';
}

export function useLatencyQuality(url: string, enabled: boolean) {
  const [quality, setQuality] = useState<Quality>('unknown');
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setQuality('unknown');
      setFailed(false);
      return;
    }

    let cancelled = false;

    const ping = async () => {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), TIMEOUT);
      const start = Date.now();

      try {
        await fetch(url, { method: 'HEAD', signal: controller.signal });
        if (cancelled) return;
        setFailed(false);
        setQuality(qualityFromMs(Date.now() - start));
      } catch {
        if (cancelled) return;
        setFailed(true);
        setQuality('weak');
      } finally {
        clearTimeout(abortTimer);
        if (!cancelled) timer.current = setTimeout(ping, INTERVAL);
      }
    };

    ping();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [url, enabled]);

  return { quality, failed };
}