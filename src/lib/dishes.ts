import type { Food, FoodData } from './foods'

/** Yemekler dosyasındaki bir satır: değerler 1 porsiyon içindir (g: yaklaşık porsiyon ağırlığı). */
export interface Dish {
  n: string
  c: string
  g: number
  k: number
  p: number | null
  h: number | null
  y: number | null
  l: number | null
  s: number | null
  src: string
}

export const DISH_GROUP = 'Yemekler'
export const isDish = (f: Food) => f.code.startsWith('yemek-')

/** Yemeği, besinlerle aynı yapıya (100 g başına değer) çevirir; 1 porsiyon = g gram. */
export function dishToFood(d: Dish, i: number, data: FoodData, groupIdx: number): Food {
  const ci = (name: string) => data.comps.findIndex((x) => x[0] === name)
  const v: Record<string, number> = {}
  const put = (name: string, x: number | null) => { if (x != null && ci(name) >= 0) v[ci(name)] = Math.round((x / d.g) * 1000) / 10 }
  put('Enerji (kcal)', d.k); put('Protein', d.p); put('Karbonhidrat', d.h); put('Yağ, toplam', d.y); put('Lif, toplam diyet', d.l); put('Sodyum, Na', d.s)
  return { id: `yemek-${i}`, code: `yemek-${i}`, name: d.n, sci: '', local: d.c, groups: [groupIdx], v, portion: d.g, cat: d.c, src: d.src }
}
