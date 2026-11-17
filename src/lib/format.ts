export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('tr-TR')

/** "12,5" ve "12.5" ikisini de kabul eder; boş veya geçersizse null */
export function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}