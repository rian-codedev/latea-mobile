import { parseIndonesianNumber } from './number-parser';

/* ══════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════ */

const WAKE_WORD_PATTERNS = [
  /^hai\s+latea\b/i,
  /^hi\s+latea\b/i,
  /^hei\s+latea\b/i,
  /^hey\s+latea\b/i,
];

const VERB_PATTERNS = [
  /^tambahkan\b/i,
  /^tambah\b/i,
  /^masukkan\b/i,
  /^isi\b/i,
  /^beli\b/i,
  /^add\b/i,
];

/**
 * Qty limit = 99.
 * Angka ≥ 100 dianggap bagian dari nama produk
 * (mis. "es batu 1000" → qty 1, bukan qty 1000).
 */
const QTY_MAX = 99;

/* ══════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════ */

export type ParseResult =
  | { kind: 'parsed'; productQuery: string; quantity: number }
  | { kind: 'empty' }
  | { kind: 'only-wake-word' }
  | { kind: 'only-verb' }
  | { kind: 'only-qty' };

/* ══════════════════════════════════════════════════════
   Main Parser
   ══════════════════════════════════════════════════════ */

/**
 * Parse raw STT text → product query + quantity.
 *
 * Steps:
 *  1. Normalize (lowercase, strip punctuation, collapse spaces)
 *  2. Strip wake word prefix ("hai latea", "hi latea", ...)
 *  3. Strip verb prefix ("tambah", "isi", ...)
 *  4. Extract trailing OR leading quantity (1-99)
 *  5. Return remaining text as productQuery
 */
export function parseVoiceCommand(rawText: string): ParseResult {
  if (!rawText) return { kind: 'empty' };

  // Normalize
  let text = rawText
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return { kind: 'empty' };

  // Strip wake word
  let hadWakeWord = false;
  for (const pattern of WAKE_WORD_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, '').trim();
      hadWakeWord = true;
      break;
    }
  }

  if (!text) return { kind: 'only-wake-word' };

  // Strip verb
  let hadVerb = false;
  for (const pattern of VERB_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, '').trim();
      hadVerb = true;
      break;
    }
  }

  if (!text) return { kind: 'only-verb' };

  // Extract quantity (trailing first, then leading)
  const { qty, rest } = extractQuantity(text);

  if (!rest.trim()) {
    return { kind: 'only-qty' };
  }

  // Silent suppress unused-var warning (kept for debugging)
  void hadWakeWord;
  void hadVerb;

  return {
    kind: 'parsed',
    productQuery: rest.trim(),
    quantity: qty,
  };
}

/* ══════════════════════════════════════════════════════
   Quantity Extraction
   ══════════════════════════════════════════════════════ */

function extractQuantity(text: string): { qty: number; rest: string } {
  const tokens = text.split(/\s+/);
  if (tokens.length === 0) return { qty: 1, rest: text };

  const maxLen = Math.min(3, tokens.length);

  // 1. Try trailing (paling umum di Indonesia: "teh ori 2")
  for (let len = maxLen; len >= 1; len--) {
    const phrase = tokens.slice(-len).join(' ');
    const qty = parseIndonesianNumber(phrase);
    if (qty !== null && qty >= 1 && qty <= QTY_MAX) {
      const rest = tokens.slice(0, -len).join(' ');
      // ⭐ FIX: return even if rest empty — caller decides if it's only-qty
      return { qty, rest };
    }
  }

  // 2. Try leading (fallback: "dua teh ori")
  for (let len = maxLen; len >= 1; len--) {
    const phrase = tokens.slice(0, len).join(' ');
    const qty = parseIndonesianNumber(phrase);
    if (qty !== null && qty >= 1 && qty <= QTY_MAX) {
      const rest = tokens.slice(len).join(' ');
      // ⭐ FIX: same
      return { qty, rest };
    }
  }

  // No quantity → default 1
  return { qty: 1, rest: text };
}