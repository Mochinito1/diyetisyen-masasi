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
  name: string
  sci: string
  local: string
  groups: number[]
  v: Record<string, number>
}

/** Bileşen indeksleri (comps dizisindeki sıra) */
export const C = { kcal: 0, protein: 4, fat: 6, carb: 7, fiber: 8 } as const

export function toFoods(d: FoodData): Food[] {
  return d.foods.map((r) => ({ name: r[0], groups: r[2], sci: r[3], local: r[4], id: r[6], v: r[7] }))
}

/** Türkçe karakterleri sadeleştirip küçük harfe çevirir: "Şeker" -> "seker" */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

export function searchFoods(foods: Food[], query: string, group: number | null): Food[] {
  const q = fold(query.trim())
  return foods.filter((f) => {
    if (group !== null && !f.groups.includes(group)) return false
    if (!q) return true
    return fold(`${f.name} ${f.sci} ${f.local}`).includes(q)
  })
}