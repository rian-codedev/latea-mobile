// lib/sales-queue.ts
let chain: Promise<unknown> = Promise.resolve();

function isRetriable(e: unknown) {
  const status = (e as { response?: { status?: number } })?.response?.status;
  return status === undefined || status >= 500 || status === 408 || status === 429;
}

async function withRetry<T>(task: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await task();
    } catch (e) {
      if (attempt >= retries || !isRetriable(e)) throw e;
      attempt += 1;
      await new Promise((r) => setTimeout(r, 800 * 2 ** (attempt - 1)));
    }
  }
}

export function enqueueSale<T>(task: () => Promise<T>): Promise<T> {
  const next = chain.then(() => withRetry(task));
  chain = next.catch(() => undefined); // satu job gagal tidak memblokir antrean
  return next;
}