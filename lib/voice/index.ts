import type { ApiProduct } from '@/lib/api/product';
import { parseVoiceCommand } from './parser';
import { matchProduct } from './matcher';
import type { VoiceParseResult } from './types';

export * from './types';
export { parseVoiceCommand } from './parser';
export { parseIndonesianNumber } from './number-parser';
export { matchProduct } from './matcher';

/**
 * Main entry point.
 *
 * Terima raw STT text + products → VoiceParseResult.
 * Result menentukan aksi selanjutnya di UI (auto-add / confirm / picker / skip).
 */
export function processVoiceCommand(
  rawText: string,
  products: ApiProduct[],
): VoiceParseResult {
  const parsed = parseVoiceCommand(rawText);

  if (parsed.kind !== 'parsed') {
    return {
      kind: 'no-match',
      reason: parsed.kind,
      normalized: '',
      originalText: rawText,
    };
  }

  return matchProduct(
    parsed.productQuery,
    parsed.quantity,
    products,
    rawText,
  );
}