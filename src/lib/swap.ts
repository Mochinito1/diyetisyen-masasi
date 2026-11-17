import { C, fold, type Food } from './foods'
import { foodUnits, makeItem, portion, type MenuItem } from './menu'

export type SwapMode = 'kcal' | 'prot' | 'same'

/** Enerjinin protein, karbonhidrat, yağdan gelen payları (toplam 1) */
export function macroShare(F: Food): [number, number, number] {
  const p = (F.v[C.protein] ?? 0) * 4
  const c = (F.v[C.carb] ?? 0) * 4
  const f = (F.v[C.fat] ?? 0) * 9
  const s = p + c + f || 1
  return [p / s, c / s, f / s]
}

const EXCLUDE = /^(yumurta, (devekuşu|bıldırcın))|konserve|dondurulmuş|kuru çorba/

/**
 * Değişim adayları. Arama yoksa aynı gruptan, makro dağılımı ve enerjisi eski besine en yakın olanlar;
 * arama varsa ada göre eşleşenler (kısa adlar önce). En fazla 12.
 */
export function swapCandidates(
  foods: Food[], old: Food, query: string, hidden?: (f: Food) => boolean,
): Food[] {
  const tk = fold(query).trim().split(/\s+/).filter(Boolean)
  const os = macroShare(old)
  const oldKcal = old.v[C.kcal] ?? 0
  const out: [number, Food][] = []
  for (const F of foods) {
    const kcal = F.v[C.kcal] ?? 0
    if (F.code === old.code || !kcal || hidden?.(F)) continue
    if (tk.length) {
      const name = fold(F.name)
      if (!tk.every((t) => `${name} ${fold(F.sci)} ${fold(F.local)}`.includes(t))) continue
      out.push([name.length, F])
      continue
    }
    if (F.groups[0] !== old.groups[0]) continue
    if (EXCLUDE.test(F.name.toLocaleLowerCase('tr'))) continue
    const s = macroShare(F)
    const d = Math.abs(s[0] - os[0]) + Math.abs(s[1] - os[1]) + Math.abs(s[2] - os[2]) + Math.abs((kcal - oldKcal) / Math.max(oldKcal, 50)) * 0.3
    out.push([d, F])
  }
  out.sort((a, b) => a[0] - b[0])
  return out.slice(0, 12).map((x) => x[1])
}

/** Gramı en uygun ev ölçüsüne çevirir (0,5 adım); ölçü yoksa 5 g adımlı gram */
export function bestQty(F: Food, groups: string[], g: number): { u: string; q: number } {
  const L = foodUnits(F, groups)
  if (L.length <= 1 || g <= 0) return { u: 'g', q: Math.max(5, Math.round(g / 5) * 5) }
  const un = L[0]
  const q = Math.max(0.5, Math.round((g / un.g) * 2) / 2)
  return { u: un.u, q }
}

/** Eski kalemin yerine konacak yeni kalem: enerji, protein ya da gram korunur. */
export function swapItem(old: MenuItem, O: Food, F: Food, groups: string[], mode: SwapMode): MenuItem {
  const ot = portion(O, old.g)
  let g2: number
  if (mode === 'same') g2 = old.g
  else if (mode === 'prot') {
    const pp = F.v[C.protein] ?? 0
    g2 = pp > 0 ? (ot.p / pp) * 100 : old.g
  } else g2 = (ot.kcal / (F.v[C.kcal] || 1)) * 100
  g2 = Math.max(1, Math.min(1500, g2))
  const b = bestQty(F, groups, g2)
  return makeItem(F, groups, b.q, b.u, old.meal)
}