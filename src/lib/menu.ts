import type { Food, FoodData } from './foods'
import { C, fold } from './foods'
import { macros, sodiumLimit, type CalcResult } from './formulas'
import { fmt, fmtMax } from './format'
import { unitsFor } from './units'

export const MEALS = ['Kahvaltı', 'Ara öğün 1', 'Öğle', 'Ara öğün 2', 'Akşam', 'Ara öğün 3'] as const
export type Meal = (typeof MEALS)[number]

/** Menü kalemi: g gerçek değerdir; u ve q yalnızca görüntü içindir. */
export interface MenuItem {
  code: string
  g: number
  meal: Meal
  u: string
  q: number
}

export const shortName = (n: string) => n.replace(/\s*\(.*$/, '').trim()

export const foodUnits = (f: Food, groups: string[]) => unitsFor(f.name, groups[f.groups[0]] ?? '')

/** Miktar ve ölçüden kalem üretir; gram en az 1 olacak şekilde yuvarlanır. */
export function makeItem(f: Food, groups: string[], q: number, u: string, meal: Meal): MenuItem {
  const L = foodUnits(f, groups)
  const unit = L.some((x) => x.u === u) ? u : 'g'
  const per = L.find((x) => x.u === unit)!.g
  const qty = q > 0 ? q : unit === 'g' ? 100 : 1
  return { code: f.code, g: Math.max(1, Math.round(qty * per)), meal, u: unit, q: qty }
}

/** Mikro besin satırları: [etiket, TürKomp bileşen adı, birim, referans (yetişkin, yaklaşık EFSA)] */
export const MICRO: [string, string, string, ((male: boolean, age: number) => number) | null][] = [
  ['Kalsiyum', 'Kalsiyum, Ca', 'mg', () => 950],
  ['Demir', 'Demir, Fe', 'mg', (m, a) => (m || a >= 51 ? 11 : 16)],
  ['Magnezyum', 'Magnezyum, Mg', 'mg', (m) => (m ? 350 : 300)],
  ['Potasyum', 'Potasyum, K', 'mg', () => 3500],
  ['Çinko', 'Çinko, Zn', 'mg', null],
  ['Fosfor', 'Fosfor, P', 'mg', () => 550],
  ['C vitamini', 'C vitamini', 'mg', (m) => (m ? 110 : 95)],
  ['A vitamini (RE)', 'A vitamini', 'RE', (m) => (m ? 750 : 650)],
  ['E vitamini', 'E vitamini', 'α-TE', (m) => (m ? 13 : 11)],
  ['B-6 vitamini', 'B-6 vitamini, toplam', 'mg', (m) => (m ? 1.7 : 1.6)],
  ['B-12 vitamini', 'B-12 vitamini', 'µg', () => 4],
  ['Folat', 'Folat, gıda', 'µg', () => 330],
  ['D vitamini', 'D-3 vitamini (kolekalsiferol)', 'µg', () => 15],
  ['K-1 vitamini', 'K-1 vitamini', 'µg', () => 70],
  ['Kolesterol', 'Kolesterol', 'mg', null],
  ['Doymuş yağ', 'Yağ asitleri, toplam doymuş', 'g', null],
]

export interface Totals {
  kcal: number
  p: number
  c: number
  f: number
  fib: number
  na: number
  mic: Record<string, number>
}

/** Bileşen adı -> dizin (data.comps içindeki sıra) */
export function compIndex(d: FoodData): Record<string, number> {
  const o: Record<string, number> = {}
  d.comps.forEach((c, i) => (o[c[0]] = i))
  return o
}

export function totals(items: MenuItem[], byCode: Map<string, Food>, idx: Record<string, number>): Totals {
  const T: Totals = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, na: 0, mic: {} }
  const naIdx = idx['Sodyum, Na']
  for (const it of items) {
    const F = byCode.get(it.code)
    if (!F) continue
    const k = it.g / 100
    const g = (i: number) => (F.v[i] ?? 0) * k
    T.kcal += g(C.kcal)
    T.p += g(C.protein)
    T.c += g(C.carb)
    T.f += g(C.fat)
    T.fib += g(C.fiber)
    T.na += g(naIdx)
    for (const m of MICRO) T.mic[m[1]] = (T.mic[m[1]] ?? 0) + g(idx[m[1]])
  }
  return T
}

export function portion(F: Food, grams: number) {
  const k = grams / 100
  const v = (i: number) => (F.v[i] ?? 0) * k
  return { kcal: v(C.kcal), p: v(C.protein), c: v(C.carb), f: v(C.fat) }
}

export interface MenuWarning {
  tone: 'warn' | 'bad'
  text: string
}

/** Menü toplamını danışan hedefleriyle karşılaştırıp uyarı üretir. */
export function warnList(r: CalcResult | null, age: number | null, T: Totals, itemCount: number, macroPct = { c: 50, p: 20 }): MenuWarning[] {
  const W: MenuWarning[] = []
  if (!r || r.infant || !itemCount || r.target == null || age == null) return W
  const m = macros(r.target, macroPct.c, macroPct.p)
  const sl = sodiumLimit(age, r.target)
  const pc = (a: number, b: number) => (b ? (a / b) * 100 : 0)
  const e = pc(T.kcal, r.target)
  if (e > 105) W.push({ tone: 'bad', text: `Enerji hedefin üstünde: ${fmt(T.kcal)} / ${fmt(r.target)} kcal (%${fmt(e)})` })
  else if (e < 90) W.push({ tone: 'warn', text: `Enerji hedefin altında: ${fmt(T.kcal)} / ${fmt(r.target)} kcal (%${fmt(e)})` })
  if (pc(T.p, m.proteinG) < 90) W.push({ tone: 'warn', text: `Protein hedefin altında: ${fmt(T.p)} / ${fmt(m.proteinG)} g` })
  else if (pc(T.p, m.proteinG) > 130) W.push({ tone: 'warn', text: `Protein hedefin belirgin üstünde: ${fmt(T.p)} / ${fmt(m.proteinG)} g` })
  if (T.na > sl) W.push({ tone: 'bad', text: `Sodyum yüksek: ${fmt(T.na)} / ${fmt(sl)} mg (yaklaşık ${fmt((T.na * 2.5) / 1000, 1)} g tuz)` })
  const fibreGoal = (r.target / 1000) * 14
  if (pc(T.fib, fibreGoal) < 70) W.push({ tone: 'warn', text: `Lif hedefin altında: ${fmt(T.fib)} / ${fmt(fibreGoal)} g` })
  if (pc(T.c, m.carbG) > 115) W.push({ tone: 'warn', text: `Karbonhidrat hedefin üstünde: ${fmt(T.c)} / ${fmt(m.carbG)} g` })
  if (pc(T.f, m.fatG) > 115) W.push({ tone: 'warn', text: `Yağ hedefin üstünde: ${fmt(T.f)} / ${fmt(m.fatG)} g` })
  return W
}

/** Menüde besin arama: her kelime ad, bilimsel veya yöresel adda geçmeli; ad başı eşleşme öne çıkar. */
export function searchForMenu(foods: Food[], query: string, limit = 10): Food[] {
  const tk = fold(query).trim().split(/\s+/).filter(Boolean)
  if (!tk.length) return []
  const scored: [number, Food][] = []
  for (const f of foods) {
    const name = fold(f.name)
    const hay = `${name} ${fold(f.sci)} ${fold(f.local)}`
    if (!tk.every((t) => hay.includes(t))) continue
    scored.push([(name.startsWith(tk[0]) ? 0 : 1) + name.length / 500, f])
  }
  scored.sort((a, b) => a[0] - b[0])
  return scored.slice(0, limit).map((s) => s[1])
}

/** Panoya yapıştırılabilir (Excel uyumlu) sekmeli metin */
export function menuTSV(items: MenuItem[], byCode: Map<string, Food>): string {
  const lines = ['Öğün\tBesin\tMiktar\tGram\tkcal\tProtein g\tKarbonhidrat g\tYağ g']
  const sorted = [...items].sort((a, b) => MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal))
  for (const it of sorted) {
    const F = byCode.get(it.code)
    if (!F) continue
    const t = portion(F, it.g)
    const amount = it.u === 'g' ? `${fmt(it.g)} g` : `${fmtMax(it.q, 2)} ${it.u}`
    lines.push([it.meal, F.name, amount, it.g, Math.round(t.kcal), fmt(t.p, 1), fmt(t.c, 1), fmt(t.f, 1)].join('\t'))
  }
  return lines.join('\n')
}