import type { Food, FoodData } from './foods'
import { pnum } from './dossier'

/** Yönetici/diyetisyenin eklediği besin; değerler 100 g başına */
export interface CustomFood {
  id: string
  name: string
  /** Besin grubu adı (TürKomp grupları arasından) */
  group: string
  kcal: number
  protein: number
  carb: number
  fat: number
  fiber?: number
  sodium?: number
}

/** Özel besini TürKomp bileşen dizinine göre Food nesnesine çevirir. Grup bulunamazsa "Muhtelif gıda". */
export function customToFood(c: CustomFood, d: FoodData): Food {
  const ci = (name: string) => d.comps.findIndex((x) => x[0] === name)
  const v: Record<string, number> = {
    [ci('Enerji (kcal)')]: c.kcal, [ci('Protein')]: c.protein, [ci('Karbonhidrat')]: c.carb, [ci('Yağ, toplam')]: c.fat,
  }
  if (c.fiber != null) v[ci('Lif, toplam diyet')] = c.fiber
  if (c.sodium != null) v[ci('Sodyum, Na')] = c.sodium
  const g = d.groups.indexOf(c.group)
  return { id: `custom-${c.id}`, code: `custom-${c.id}`, name: c.name, sci: '', local: '', groups: [g >= 0 ? g : d.groups.indexOf('Muhtelif gıda')], v }
}

/** CSV: ad; grup; kcal; protein; karbonhidrat; yağ; lif; sodyum (ayırıcı ; , veya sekme). İlk satır başlık. */
export function parseFoodCsv(text: string): { foods: Omit<CustomFood, 'id'>[]; skipped: number; error?: string } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { foods: [], skipped: 0, error: 'Dosyada başlık ve en az bir satır olmalı' }
  const delim = [';', '\t', ','].map((d) => [d, lines[0].split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const head = lines[0].split(delim).map((x) => x.replace(/"/g, '').trim().toLocaleLowerCase('tr'))
  const col = (re: RegExp) => head.findIndex((x) => re.test(x))
  const ci = { n: col(/^(ad|besin|isim|name)/), g: col(/grup|group/), k: col(/kcal|enerji|energy/), p: col(/protein/), c: col(/karbon|carb/), f: col(/^yağ|^yag|fat/), l: col(/lif|fiber|fibre/), s: col(/sodyum|sodium/) }
  if (ci.n < 0 || ci.k < 0) return { foods: [], skipped: 0, error: 'Besin adı ve kcal sütunları bulunamadı' }
  const foods: Omit<CustomFood, 'id'>[] = []
  let skipped = 0
  for (const ln of lines.slice(1)) {
    const c = ln.split(delim).map((x) => x.replace(/"/g, '').trim())
    const get = (i: number, hi: number) => (i >= 0 ? pnum(c[i], 0, hi) : null)
    const kcal = get(ci.k, 1000)
    if (!c[ci.n] || kcal == null) { skipped++; continue }
    foods.push({
      name: c[ci.n], group: ci.g >= 0 ? c[ci.g] : 'Muhtelif gıda', kcal,
      protein: get(ci.p, 100) ?? 0, carb: get(ci.c, 100) ?? 0, fat: get(ci.f, 100) ?? 0,
      ...(get(ci.l, 100) != null ? { fiber: get(ci.l, 100)! } : {}), ...(get(ci.s, 50000) != null ? { sodium: get(ci.s, 50000)! } : {}),
    })
  }
  return { foods, skipped }
}