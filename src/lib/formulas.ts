export type Sex = 'K' | 'E'

export interface Person {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
}

/** Mifflin-St Jeor: bazal metabolizma hızı (kcal/gün) */
export function bmrMifflin({ sex, age, heightCm, weightKg }: Person): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'E' ? base + 5 : base - 161
}

/** Vücut kitle indeksi */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}

/** Günlük enerji ihtiyacı = BMH x aktivite katsayısı + hedef farkı */
export function dailyEnergy(bmr: number, activity: number, goalDelta: number): number {
  return bmr * activity + goalDelta
}