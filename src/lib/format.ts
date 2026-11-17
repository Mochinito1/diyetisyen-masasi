export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('tr-TR')

/** "12,5" ve "12.5" ikisini de kabul eder; boş veya geçersizse null */
export function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
/** En fazla digits ondalık (gereksiz sıfır yok): 2 -> "2", 1,5 -> "1,5" */
export const fmtMax = (n: number, digits = 2) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: digits })

/** Besin değeri gösterimi: büyüklüğe göre ondalık sayısı, çok küçükse "<0,01" */
export function fmtVal(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '–'
  const a = Math.abs(v)
  if (v === 0) return '0'
  if (a >= 100) return fmtMax(v, 0)
  if (a >= 10) return fmtMax(v, 1)
  if (a >= 0.01) return fmtMax(v, 2)
  return '<0,01'
}
