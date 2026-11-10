/* ══════════════════════════════════════════════════════
   Indonesian Number Parser (1-99)
   ══════════════════════════════════════════════════════ */

const UNITS: Record<string, number> = {
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
};

const EXACT_NUMBERS: Record<string, number> = {
  ...UNITS,
  sepuluh: 10,
  sebelas: 11,
  'dua belas': 12,
  duabelas: 12,
  'tiga belas': 13,
  tigabelas: 13,
  'empat belas': 14,
  empatbelas: 14,
  'lima belas': 15,
  limabelas: 15,
  'enam belas': 16,
  enambelas: 16,
  'tujuh belas': 17,
  tujuhbelas: 17,
  'delapan belas': 18,
  delapanbelas: 18,
  'sembilan belas': 19,
  sembilanbelas: 19,
  'dua puluh': 20,
  duapuluh: 20,
  'tiga puluh': 30,
  tigapuluh: 30,
  'empat puluh': 40,
  empatpuluh: 40,
  'lima puluh': 50,
  limapuluh: 50,
  'enam puluh': 60,
  enampuluh: 60,
  'tujuh puluh': 70,
  tujuhpuluh: 70,
  'delapan puluh': 80,
  delapanpuluh: 80,
  'sembilan puluh': 90,
  sembilanpuluh: 90,
};

const TENS_PREFIX = [
  ['dua', 2],
  ['tiga', 3],
  ['empat', 4],
  ['lima', 5],
  ['enam', 6],
  ['tujuh', 7],
  ['delapan', 8],
  ['sembilan', 9],
] as const;

export function parseIndonesianNumber(phrase: string): number | null {
  const normalized = phrase
    .trim()
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized) return null;

  // Pure digit
  if (/^\d+$/.test(normalized)) {
    return parseInt(normalized, 10);
  }

  // Exact match
  if (normalized in EXACT_NUMBERS) {
    return EXACT_NUMBERS[normalized];
  }

  // Compound: "dua puluh satu" / "duapuluhsatu" / "duapuluh satu"
  for (const [word, value] of TENS_PREFIX) {
    const tens = value * 10;
    const re = new RegExp(`^${word}\\s*puluh\\s*(\\w+)$`);
    const m = normalized.match(re);
    if (m) {
      const unit = UNITS[m[1]];
      if (unit !== undefined) return tens + unit;
    }
  }

  return null;
}