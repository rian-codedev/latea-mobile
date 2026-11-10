import fuzzysort from 'fuzzysort';
import type { ApiProduct } from '@/lib/api/product';
import type { MatchedCandidate, VoiceParseResult } from './types';

/* ══════════════════════════════════════════════════════
   Confidence thresholds
   ══════════════════════════════════════════════════════ */

const THRESHOLD_AUTO = 0.9;   // ≥ 0.90 → auto-add
const THRESHOLD_CONFIRM = 0.6; // 0.60–0.89 → confirm modal
const THRESHOLD_PICKER = 0.4;  // 0.40–0.59 → picker
const AMBIGUITY_GAP = 0.1;     // gap < 0.10 → downgrade 1 level

/* ══════════════════════════════════════════════════════
   Match product
   ══════════════════════════════════════════════════════ */

export function matchProduct(
  query: string,
  quantity: number,
  products: ApiProduct[],
  originalText: string,
): VoiceParseResult {
  // Only match active products (sama seperti katalog kasir)
  const active = products.filter((p) => p.is_active);

  if (active.length === 0) {
    return {
      kind: 'no-match',
      reason: 'no-products',
      normalized: query,
      originalText,
    };
  }

  const results = fuzzysort.go(query, active, {
    key: 'name',
    limit: 5,
    threshold: THRESHOLD_PICKER,
  });

  if (results.length === 0) {
    return {
      kind: 'no-match',
      reason: 'no-match-found',
      normalized: query,
      originalText,
    };
  }

  const candidates: MatchedCandidate[] = results.map((r) => ({
    product: r.obj,
    score: r.score,
  }));

  const top = candidates[0];
  const second = candidates[1];

  // Ambiguity: gap antara top & second terlalu kecil
  const isAmbiguous =
    !!second && top.score - second.score < AMBIGUITY_GAP;

  // Classification
  if (top.score >= THRESHOLD_AUTO && !isAmbiguous) {
    return {
      kind: 'auto-add',
      product: top.product,
      quantity,
      score: top.score,
      normalized: query,
    };
  }

  // ⭐ FIX: Ambiguous + ada multiple kandidat → picker
  // (misal "teh ori" ambigu antara Mini/Jumbo → user harus pilih)
  if (
    isAmbiguous &&
    candidates.length >= 2 &&
    top.score >= THRESHOLD_CONFIRM
  ) {
    return {
      kind: 'picker',
      candidates,
      quantity,
      normalized: query,
      originalText,
    };
  }

  if (top.score >= THRESHOLD_CONFIRM) {
    return {
      kind: 'confirm',
      product: top.product,
      quantity,
      score: top.score,
      normalized: query,
      originalText,
    };
  }

  // 0.40–0.59 → picker
  return {
    kind: 'picker',
    candidates,
    quantity,
    normalized: query,
    originalText,
  };
}