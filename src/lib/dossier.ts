import type { Appointment } from './appointments'

/** Antropometrik ölçüm: tarih (YYYY-MM-DD) + en az bir değer */
export interface Measurement {
  d: string
  w?: number // kilo kg
  b?: number // bel cm
  k?: number // kalça cm
  y?: number // yağ oranı %
}
export type MetricKey = 'w' | 'b' | 'k' | 'y' | 'o'

export const METRICS: Record<MetricKey, { label: string; unit: string; digits: number }> = {
  w: { label: 'Kilo', unit: 'kg', digits: 1 },
  b: { label: 'Bel', unit: 'cm', digits: 1 },
  k: { label: 'Kalça', unit: 'cm', digits: 1 },
  y: { label: 'Yağ oranı', unit: '%', digits: 1 },
  o: { label: 'Bel/kalça oranı', unit: '', digits: 2 },
}

export interface LabResult {
  id: string
  d: string
  k: string
  v: number | null
  u: string
}

export interface SessionNote {
  id: string
  d: string
  t: string
}

export interface Anamnesis {
  neden: string
  ilac: string
  alerji: string
  alisk: string
}
export const EMPTY_ANAMNESIS: Anamnesis = { neden: '', ilac: '', alerji: '', alisk: '' }

export const LAB_TESTS: [name: string, unit: string][] = [
  ['Açlık kan şekeri', 'mg/dL'], ['HbA1c', '%'], ['Total kolesterol', 'mg/dL'], ['LDL', 'mg/dL'], ['HDL', 'mg/dL'],
  ['Trigliserid', 'mg/dL'], ['TSH', 'mIU/L'], ['Ferritin', 'ng/mL'], ['Hemoglobin', 'g/dL'], ['B12', 'pg/mL'],
  ['D vitamini', 'ng/mL'], ['Kreatinin', 'mg/dL'], ['Ürik asit', 'mg/dL'], ['Diğer', ''],
]

/** Genel referans eşiklerine göre bayrak (laboratuvarın kendi aralığı esas alınmalı) */
export function labFlag(test: string, v: number | null, sex: string): 'Yüksek' | 'Düşük' | '' {
  if (v == null) return ''
  switch (test) {
    case 'Açlık kan şekeri': return v >= 100 ? 'Yüksek' : v < 70 ? 'Düşük' : ''
    case 'HbA1c': return v >= 5.7 ? 'Yüksek' : ''
    case 'Total kolesterol': return v >= 200 ? 'Yüksek' : ''
    case 'LDL': return v >= 130 ? 'Yüksek' : ''
    case 'HDL': return v < (sex === 'E' ? 40 : 50) ? 'Düşük' : ''
    case 'Trigliserid': return v >= 150 ? 'Yüksek' : ''
    default: return ''
  }
}

/** Metin → sayı; aralık dışıysa null. Virgül ve nokta kabul edilir. */
export function pnum(v: string | number | null | undefined, lo: number, hi: number): number | null {
  const x = parseFloat(String(v ?? '').replace(',', '.'))
  return x >= lo && x <= hi ? x : null
}

export function seriesOf(meas: Measurement[], key: MetricKey): { d: string; v: number }[] {
  const out: { d: string; v: number }[] = []
  for (const m of meas) {
    const v = key === 'o' ? (m.b && m.k ? m.b / m.k : null) : (m[key] ?? null)
    if (v != null && !isNaN(v)) out.push({ d: m.d, v })
  }
  return out
}

/** Bel/kalça oranı ve DSÖ abdominal obezite eşiği (erkek 0,90, kadın 0,85) */
export function waistHip(m: Measurement, sex: string): { ratio: number; high: boolean } | null {
  if (!(m.b && m.k)) return null
  const ratio = m.b / m.k
  return { ratio, high: ratio > (sex === 'E' ? 0.9 : 0.85) }
}

export const sortMeas = (list: Measurement[]) => [...list].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))

/** Aynı gün iki ölçüm varsa değerler birleştirilir (sonradan girilen öncekini ezer). */
export function mergeMeas(list: Measurement[], add: Measurement[]): Measurement[] {
  const byDay = new Map(list.map((m) => [m.d, m]))
  for (const m of add) byDay.set(m.d, { ...byDay.get(m.d), ...m })
  return sortMeas([...byDay.values()])
}

export const latestWeight = (meas: Measurement[]): number | null => [...meas].reverse().find((m) => m.w != null)?.w ?? null

/** Tartı uygulamasından dışa aktarılan CSV: ; , ya da sekme ayırıcı; tarih 2026-11-16 veya 16.11.2026 */
export function parseCsv(text: string): { rows: Measurement[]; error?: string } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [] }
  const delim = [';', '\t', ','].map((d) => [d, lines[0].split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const head = lines[0].split(delim).map((x) => x.replace(/"/g, '').trim().toLocaleLowerCase('tr'))
  const col = (re: RegExp) => head.findIndex((x) => re.test(x))
  const ci = {
    d: col(/tarih|date|zaman|time/), w: col(/kilo|weight|ağırlık|agirlik/), b: col(/bel|waist/),
    k: col(/kalça|kalca|hip/), y: col(/yağ|yag|fat/),
  }
  if (ci.d < 0) return { rows: [], error: 'Tarih sütunu bulunamadı' }
  const rows: Measurement[] = []
  for (const ln of lines.slice(1)) {
    const c = ln.split(delim)
    const ds = (c[ci.d] ?? '').replace(/"/g, '').trim()
    let iso: string | null = null
    let mm: RegExpMatchArray | null
    if ((mm = ds.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) iso = `${mm[1]}-${mm[2].padStart(2, '0')}-${mm[3].padStart(2, '0')}`
    else if ((mm = ds.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/))) iso = `${mm[3]}-${mm[2].padStart(2, '0')}-${mm[1].padStart(2, '0')}`
    if (!iso) continue
    const get = (i: number, lo: number, hi: number) => (i >= 0 ? pnum((c[i] ?? '').replace(/"/g, '').trim(), lo, hi) : null)
    const r: Measurement = { d: iso }
    const w = get(ci.w, 2, 500), b = get(ci.b, 20, 300), k = get(ci.k, 20, 300), y = get(ci.y, 1, 70)
    if (w != null) r.w = w
    if (b != null) r.b = b
    if (k != null) r.k = k
    if (y != null) r.y = y
    if (Object.keys(r).length > 1) rows.push(r)
  }
  return { rows }
}

/** Son görüşme tarihi: "geldi" randevuları, seans notları, ölçümler, elle işaret ve kayıt tarihi arasında en yenisi */
export function lastVisit(
  c: { id: string; meas: Measurement[]; sess: SessionNote[]; lv?: string; created: number },
  aps: Appointment[],
): string {
  let best = c.lv ?? ''
  const up = (d: string | undefined) => { if (d && d > best) best = d }
  aps.forEach((a) => a.clientId === c.id && a.status === 'done' && up(a.dt.slice(0, 10)))
  c.sess.forEach((s) => up(s.d))
  c.meas.forEach((m) => up(m.d))
  if (!best && c.created) best = new Date(c.created).toISOString().slice(0, 10)
  return best
}

export const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('tr-TR')
/** İki tarih arası gün farkı (bugüne göre) */
export const daysAgo = (d: string, now = new Date()) =>
  Math.floor((new Date(`--T12:00:00`).getTime() - new Date(`T12:00:00`).getTime()) / 86400000)
