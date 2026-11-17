import { fold } from './text'
import { matchHay } from './synonyms'

/** TürKomp satırı: [ad, kod, grupİndeksleri, bilimselAd, yöresel, sınıfİndeksleri, id, {bileşenİndeksi: değer}] */
export type FoodRow = [string, string, number[], string, string, number[], string, Record<string, number>]

export interface FoodData {
  comps: [name: string, unit: string, category: string][]
  groups: string[]
  classes: string[]
  foods: FoodRow[]
}

export interface Food {
  id: string
  code: string
  name: string
  sci: string
  local: string
  groups: number[]
  v: Record<string, number>
}

/** Bileşen indeksleri (comps dizisindeki sıra) */
export const C = { kcal: 0, protein: 4, fat: 6, carb: 7, fiber: 8 } as const

export function toFoods(d: FoodData): Food[] {
  return d.foods.map((r) => ({ code: r[1], name: r[0], groups: r[2], sci: r[3], local: r[4], id: r[6], v: r[7] }))
}

export { fold } from './text'

const hayCache = new WeakMap<Food, string>()
/** Arama için katlanmış metin: ad + bilimsel ad + yöresel ad + kod */
export function foodHay(f: Food): string {
  const c = hayCache.get(f)
  if (c !== undefined) return c
  const h = fold(f.name + ' ' + f.sci + ' ' + f.local + ' ' + f.code)
  hayCache.set(f, h)
  return h
}

/** Eş anlamlılı arama: besin sorguyla eşleşiyor mu? */
export const foodMatch = (f: Food, q: string) => matchHay(foodHay(f), q)

export function searchFoods(foods: Food[], query: string, group: number | null): Food[] {
  return foods.filter((f) => (group === null || f.groups.includes(group)) && foodMatch(f, query))
}