/**
 * Manual test helper — TIDAK dipakai di production.
 * Delete sebelum production launch.
 *
 * Cara pakai:
 *   import { runVoiceTests } from '@/lib/voice/__dev__/voice-test';
 *   runVoiceTests(mockProducts);
 */

import type { ApiProduct } from '@/lib/api/product';
import { processVoiceCommand } from '../index';

const MOCK_PRODUCTS: ApiProduct[] = [
  { id: 1, code: 'ES-1000', name: 'Es Batu 1000', emoji: null, image_url: null, price: 1000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 2, code: 'ES-3000', name: 'Es Batu 3000', emoji: null, image_url: null, price: 3000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 3, code: 'ES-8000', name: 'Es Batu 8000', emoji: null, image_url: null, price: 8000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 4, code: 'TO-MINI', name: 'Teh Ori Mini', emoji: null, image_url: null, price: 3000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 5, code: 'TO-JUMBO', name: 'Teh Ori Jumbo', emoji: null, image_url: null, price: 5000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 6, code: 'TS-MINI', name: 'Teh Susu Mini', emoji: null, image_url: null, price: 4000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 7, code: 'TS-JUMBO', name: 'Teh Susu Jumbo', emoji: null, image_url: null, price: 6000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 8, code: 'TM-MINI', name: 'Teh Milo Mini', emoji: null, image_url: null, price: 4000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 9, code: 'TM-JUMBO', name: 'Teh Milo Jumbo', emoji: null, image_url: null, price: 6000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 10, code: 'TT-MINI', name: 'Teh Taro Mini', emoji: null, image_url: null, price: 4000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 11, code: 'TT-JUMBO', name: 'Teh Taro Jumbo', emoji: null, image_url: null, price: 6000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 12, code: 'TC-MINI', name: 'Teh Matcha Mini', emoji: null, image_url: null, price: 5000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 13, code: 'TC-JUMBO', name: 'Teh Matcha Jumbo', emoji: null, image_url: null, price: 7000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 14, code: 'TA-MINI', name: 'Teh Avocado Mini', emoji: null, image_url: null, price: 5000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 15, code: 'TA-JUMBO', name: 'Teh Avocado Jumbo', emoji: null, image_url: null, price: 7000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 16, code: 'TK-JUMBO', name: 'Teh Kurma Jumbo', emoji: null, image_url: null, price: 8000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 17, code: 'TV-MINI', name: 'Teh Vanila Mini', emoji: null, image_url: null, price: 4000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
  { id: 18, code: 'TV-JUMBO', name: 'Teh Vanila Jumbo', emoji: null, image_url: null, price: 6000, discount_price: null, minimal_discount: null, is_active: true, is_available: true },
];

const TEST_CASES = [
  // Wake word + verb
  'hai latea tambah teh ori mini 2',
  'hi latea isi teh susu jumbo 3',
  // Without wake word
  'tambah teh ori mini 2',
  'teh ori mini 2',
  // Word numbers
  'teh ori mini dua',
  'teh ori mini dua belas',
  'teh ori mini dua puluh',
  'dua teh ori mini',
  // Ambiguous (no Mini/Jumbo)
  'teh ori 2',
  'teh ori',
  // Edge case: product with number in name
  'es batu 1000',
  'es batu 1000 2',
  'es batu 3000 5',
  'es batu 8000',
  // Ambiguous: 3 Es Batu variants
  'es batu 3',
  // No qty
  'teh matcha jumbo',
  // No match
  'random garbage text',
  'kopi hitam',
  // Empty
  '',
  'hai latea',
  'tambah',
  '2',
];

import {
  parseConfirmAnswer,
  parsePickerAnswer,
} from '../answer-parser';

const CONFIRM_TEST_CASES: { text: string; expect: 'yes' | 'no' | null }[] = [
  { text: 'ya', expect: 'yes' },
  { text: 'iya', expect: 'yes' },
  { text: 'oke', expect: 'yes' },
  { text: 'tambah', expect: 'yes' },
  { text: 'tidak', expect: 'no' },
  { text: 'bukan', expect: 'no' },
  { text: 'batal', expect: 'no' },
  { text: 'salah', expect: 'no' },
  { text: 'ya deh', expect: 'yes' },
  { text: 'tidak tambah', expect: 'no' },
  { text: 'random', expect: null },
  { text: '', expect: null },
];

const PICKER_TEST_CASES: {
  text: string;
  count: number;
  expect: { kind: 'index'; value: number } | { kind: 'cancel' } | null;
}[] = [
    { text: 'satu', count: 3, expect: { kind: 'index', value: 1 } },
    { text: 'dua', count: 3, expect: { kind: 'index', value: 2 } },
    { text: 'tiga', count: 3, expect: { kind: 'index', value: 3 } },
    { text: '1', count: 3, expect: { kind: 'index', value: 1 } },
    { text: '2', count: 3, expect: { kind: 'index', value: 2 } },
    { text: 'pertama', count: 3, expect: { kind: 'index', value: 1 } },
    { text: 'ketiga', count: 3, expect: { kind: 'index', value: 3 } },
    { text: 'empat', count: 3, expect: null },
    { text: 'empat', count: 5, expect: { kind: 'index', value: 4 } },
    { text: 'batal', count: 3, expect: { kind: 'cancel' } },
    { text: 'cancel', count: 3, expect: { kind: 'cancel' } },
    { text: 'random', count: 3, expect: null },
    { text: '', count: 3, expect: null },
  ];

export function runAnswerTests() {
  /* eslint-disable no-console */
  console.log('\n════════════════════════════════════════════');
  console.log(`  CONFIRM ANSWER TESTS (${CONFIRM_TEST_CASES.length} cases)`);
  console.log('════════════════════════════════════════════\n');

  let pass = 0;
  let fail = 0;

  for (const tc of CONFIRM_TEST_CASES) {
    const result = parseConfirmAnswer(tc.text);
    const ok = result === tc.expect;
    if (ok) pass++;
    else fail++;
    console.log(
      `${ok ? '✅' : '❌'} "${tc.text}" → ${result} (expect ${tc.expect})`,
    );
  }

  console.log(`\n  Confirm: ${pass} pass, ${fail} fail\n`);

  pass = 0;
  fail = 0;
  console.log('════════════════════════════════════════════');
  console.log(`  PICKER ANSWER TESTS (${PICKER_TEST_CASES.length} cases)`);
  console.log('════════════════════════════════════════════\n');

  for (const tc of PICKER_TEST_CASES) {
    const result = parsePickerAnswer(tc.text, tc.count);
    const ok = JSON.stringify(result) === JSON.stringify(tc.expect);
    if (ok) pass++;
    else fail++;
    console.log(
      `${ok ? '✅' : '❌'} "${tc.text}" (count=${tc.count}) → ${JSON.stringify(result)} (expect ${JSON.stringify(tc.expect)})`,
    );
  }

  console.log(`\n  Picker: ${pass} pass, ${fail} fail\n`);
  /* eslint-enable no-console */
}

export function runVoiceTests(products: ApiProduct[] = MOCK_PRODUCTS) {
  // eslint-disable-next-line no-console
  console.log('\n════════════════════════════════════════════');
  // eslint-disable-next-line no-console
  console.log('  VOICE PARSER TESTS  (' + TEST_CASES.length + ' cases)');
  // eslint-disable-next-line no-console
  console.log('════════════════════════════════════════════\n');

  let pass = 0;
  let fail = 0;

  for (const text of TEST_CASES) {
    const result = processVoiceCommand(text, products);
    // eslint-disable-next-line no-console
    console.log(`▶ "${text}"`);
    // eslint-disable-next-line no-console
    console.log(`  →`, JSON.stringify(result, null, 0));
    // eslint-disable-next-line no-console
    console.log('');
    if (result.kind === 'no-match') fail++;
    else pass++;
  }

  // eslint-disable-next-line no-console
  console.log('════════════════════════════════════════════');
  // eslint-disable-next-line no-console
  console.log(`  Summary: ${pass} parsed, ${fail} no-match`);
  // eslint-disable-next-line no-console
  console.log('════════════════════════════════════════════\n');
  runAnswerTests();
}