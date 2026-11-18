import { LAB_TESTS } from './dossier'

/** Türkçe harfleri sadeleştirir (ı→i, ş→s ...) ve küçültür; PDF'lerdeki farklı yazımlar aynı eşleşsin diye */
const fold = (s: string) =>
  s.replace(/İ/g, 'i').replace(/I/g, 'i').toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/µ/g, 'u').replace(/μ/g, 'u')

export interface ParsedLab { k: string; v: number; u: string }
export interface ParsedReport { date: string | null; found: ParsedLab[] }

const unitOf = (name: string) => LAB_TESTS.find((t) => t[0] === name)?.[1] ?? ''

/** Sıra önemli: ilk eşleşen kural kazanır (örn. HbA1c, "hemoglobin" kuralından önce gelir; LDL/HDL, "kolesterol" kuralından önce) */
const RULES: { test: string; re: RegExp; min: number; max: number }[] = [
  { test: 'HbA1c', re: /hba1c|hemoglobin\s*a1c|glikozile|glikolize|glycated|\ba1c\b/, min: 3, max: 20 },
  { test: '', re: /vldl/, min: 0, max: 0 },
  { test: 'LDL', re: /\bldl\b|ldl-|ldl\s*kolesterol|ldl\s*chol/, min: 10, max: 500 },
  { test: 'HDL', re: /\bhdl\b|hdl-|hdl\s*kolesterol|hdl\s*chol/, min: 5, max: 200 },
  { test: 'Trigliserid', re: /trigliserid|trigliserit|trigliseri|triglycerid/, min: 10, max: 3000 },
  { test: 'Total kolesterol', re: /kolesterol|cholesterol/, min: 50, max: 600 },
  { test: 'Açlık kan şekeri', re: /glukoz|kan sekeri|glucose/, min: 20, max: 700 },
  { test: 'TSH', re: /\btsh\b|tiroid uyar/, min: 0.01, max: 150 },
  { test: 'Ferritin', re: /ferritin/, min: 1, max: 5000 },
  { test: 'Hemoglobin', re: /hemoglobin|\bhgb\b/, min: 3, max: 25 },
  { test: 'B12', re: /vitamin\s*b-?\s*12|\bb-?12\b|kobalamin|cobalamin/, min: 20, max: 5000 },
  { test: 'D vitamini', re: /25\s*-?\s*(oh|hidroksi)|vitamin\s*d|d\s*vitamini/, min: 1, max: 250 },
  { test: 'Kreatinin', re: /kreatinin(?!.*klirens)|creatinine/, min: 0.1, max: 20 },
  { test: 'Ürik asit', re: /urik\s*asit|uric\s*acid/, min: 0.5, max: 30 },
]

const UNIT_RE = /^\s*(mg\/dl|g\/dl|%|miu\/l|uiu\/ml|miu\/ml|ng\/ml|pg\/ml|ng\/dl|mmol\/l|umol\/l|u\/l|iu\/ml)/
const NUM_RE = /-?\d+(?:[.,]\d+)?/

const toNum = (s: string) => parseFloat(s.replace(',', '.'))

/** Rapor metninden tarihi bulur: önce "tarih/rapor/numune" geçen satırlar, sonra herhangi bir tarih. Biçim GG.AA.YYYY */
function findDate(lines: string[]): string | null {
  const re = /(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/
  const pick = (l: string) => {
    const m = l.match(re)
    if (!m) return null
    const d = +m[1], mo = +m[2]
    if (d < 1 || d > 31 || mo < 1 || mo > 12) return null
    return `${m[3]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  for (const l of lines) if (/tarih|rapor|numune|kabul|onay|date|sample/.test(fold(l))) { const r = pick(l); if (r) return r }
  for (const l of lines) { const r = pick(l); if (r) return r }
  return null
}

/** PDF'ten çıkarılan satırlardan bilinen tetkikleri ve değerlerini ayıklar. Her tetkik için ilk bulunan değer alınır. */
export function parseLabLines(lines: string[]): ParsedReport {
  const found = new Map<string, ParsedLab>()
  for (const raw of lines) {
    const line = fold(raw)
    for (const rule of RULES) {
      const m = line.match(rule.re)
      if (!m) continue
      if (rule.test && !found.has(rule.test)) {
        const rest = line.slice((m.index ?? 0) + m[0].length)
        const n = rest.match(NUM_RE)
        if (n) {
          const v = toNum(n[0])
          if (Number.isFinite(v) && v >= rule.min && v <= rule.max) {
            const after = rest.slice((n.index ?? 0) + n[0].length)
            const u = after.match(UNIT_RE)?.[1]
            found.set(rule.test, { k: rule.test, v, u: u ? (u === '%' ? '%' : unitOf(rule.test) && u.toLowerCase() === unitOf(rule.test).toLowerCase() ? unitOf(rule.test) : prettyUnit(u)) : unitOf(rule.test) })
          }
        }
      }
      break // satır bir kurala ait; sonraki kurallara bakma
    }
  }
  return { date: findDate(lines), found: LAB_TESTS.map((t) => found.get(t[0])).filter((x): x is ParsedLab => !!x) }
}

const prettyUnit = (u: string) => ({ 'miu/l': 'mIU/L', 'uiu/ml': 'µIU/mL', 'miu/ml': 'mIU/mL', 'mg/dl': 'mg/dL', 'g/dl': 'g/dL', 'ng/ml': 'ng/mL', 'pg/ml': 'pg/mL', 'ng/dl': 'ng/dL', 'mmol/l': 'mmol/L', 'umol/l': 'µmol/L', 'u/l': 'U/L', 'iu/ml': 'IU/mL' } as Record<string, string>)[u] ?? u

export const parseLabText = (text: string) => parseLabLines(text.split(/\r?\n/))
