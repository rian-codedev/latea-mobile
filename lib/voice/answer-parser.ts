/* ══════════════════════════════════════════════════════
   Voice Answer Parser
   Parse short answers saat modal terbuka.
   ══════════════════════════════════════════════════════ */

export type ConfirmAnswer = 'yes' | 'no' | null;

export type PickerAnswer =
  | { kind: 'index'; value: number } // 1-based
  | { kind: 'cancel' }
  | null;

/* ── Word lists ── */

const YES_WORDS = [
  'ya',
  'iya',
  'ia',
  'yoi',
  'yes',
  'yep',
  'ok',
  'oke',
  'okay',
  'betul',
  'benar',
  'boleh',
  'tambah',
  'tambahkan',
  'lanjut',
  'lanjutkan',
  'sudah',
  'udah',
  'sip',
  'silakan',
  'bisa',
  'setuju',
  'gas',
  'cocok',
];

const NO_WORDS = [
  'tidak',
  'tak',
  'tdk',
  'no',
  'nope',
  'bukan',
  'salah',
  'jangan',
  'stop',
  'berhenti',
  'keliru',
];

const CANCEL_WORDS = [
  'batal',
  'batalkan',
  'cancel',
  'keluar',
  'tutup',
  'stop',
  'berhenti',
];

const NUMERIC_WORDS: Record<string, number> = {
  satu: 1,
  one: 1,
  '1': 1,
  pertama: 1,
  dua: 2,
  two: 2,
  '2': 2,
  kedua: 2,
  tiga: 3,
  three: 3,
  '3': 3,
  ketiga: 3,
  empat: 4,
  four: 4,
  '4': 4,
  keempat: 4,
  lima: 5,
  five: 5,
  '5': 5,
  kelima: 5,
};

/* ── Helper: normalize ── */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasWholeWord(normalized: string, word: string): boolean {
  if (normalized === word) return true;
  if (normalized.startsWith(word + ' ')) return true;
  if (normalized.endsWith(' ' + word)) return true;
  if (normalized.includes(' ' + word + ' ')) return true;
  return false;
}

/* ── Main parsers ── */

/**
 * Parse short answer untuk Confirm Modal.
 * "ya" / "tidak" / "batal" → 'yes' / 'no'
 */
export function parseConfirmAnswer(text: string): ConfirmAnswer {
  if (!text) return null;
  const normalized = normalize(text);
  if (!normalized) return null;

  // Cek NO dulu (lebih spesifik — "tidak tambah" harusnya 'no', bukan 'yes')
  for (const w of NO_WORDS) {
    if (hasWholeWord(normalized, w)) return 'no';
  }

  for (const w of CANCEL_WORDS) {
    if (hasWholeWord(normalized, w)) return 'no';
  }

  for (const w of YES_WORDS) {
    if (hasWholeWord(normalized, w)) return 'yes';
  }

  return null;
}

/**
 * Parse short answer untuk Picker Modal.
 * "satu" / "dua" / "tiga" → index 1/2/3 (validated against candidateCount)
 * "batal" / "cancel" → cancel
 */
export function parsePickerAnswer(
  text: string,
  candidateCount: number,
): PickerAnswer {
  if (!text) return null;
  const normalized = normalize(text);
  if (!normalized) return null;

  // Cancel first
  for (const w of CANCEL_WORDS) {
    if (hasWholeWord(normalized, w)) return { kind: 'cancel' };
  }

  // Numeric (longest match first to handle "dua belas" → tidak valid karena >5)
  // Pakai single token atau simple check
  for (const [word, num] of Object.entries(NUMERIC_WORDS)) {
    if (hasWholeWord(normalized, word)) {
      if (num >= 1 && num <= candidateCount) {
        return { kind: 'index', value: num };
      }
      // Angka di luar range → ignore, coba kata lain
    }
  }

  return null;
}