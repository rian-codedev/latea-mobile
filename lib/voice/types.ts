import type { ApiProduct } from '@/lib/api/product';

export type MatchedCandidate = {
  product: ApiProduct;
  score: number;
};

export type NoMatchReason =
  | 'empty'
  | 'only-wake-word'
  | 'only-verb'
  | 'only-qty'
  | 'no-products'
  | 'no-match-found';

export type VoiceParseResult =
  | {
      kind: 'auto-add';
      product: ApiProduct;
      quantity: number;
      score: number;
      normalized: string;
    }
  | {
      kind: 'confirm';
      product: ApiProduct;
      quantity: number;
      score: number;
      normalized: string;
      originalText: string;
    }
  | {
      kind: 'picker';
      candidates: MatchedCandidate[];
      quantity: number;
      normalized: string;
      originalText: string;
    }
  | {
      kind: 'no-match';
      reason: NoMatchReason;
      normalized: string;
      originalText: string;
    };