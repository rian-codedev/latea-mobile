export function formatRupiah(value: number, withPrefix = true): string {
  const n = Math.round(value || 0);
  const s = n.toLocaleString('id-ID');
  return withPrefix ? `Rp ${s}` : s;
}