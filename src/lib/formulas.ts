export type Sex = 'K' | 'E'
export type FormulaId = 'auto' | 'mifflin' | 'harris' | 'schofield'
export type Phys = 'none' | 'g1' | 'g2' | 'g3' | 'emz'

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

/** Harris-Benedict (revize) */
export function bmrHarris({ sex, age, heightCm, weightKg }: Person): number {
  return sex === 'E'
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age
}

/** Schofield (FAO/WHO): çocuk ve yaşlılar için de geçerli */
export function bmrSchofield({ sex, age, weightKg: w }: Person): number {
  const m = sex === 'E'
  if (age < 3) return m ? 60.9 * w - 54 : 61.0 * w - 51
  if (age < 10) return m ? 22.7 * w + 495 : 22.5 * w + 499
  if (age < 18) return m ? 17.5 * w + 651 : 12.2 * w + 746
  if (age < 30) return m ? 15.057 * w + 692.2 : 14.818 * w + 486.6
  if (age < 60) return m ? 11.472 * w + 873.1 : 8.126 * w + 845.6
  return m ? 11.711 * w + 587.7 : 9.082 * w + 658.5
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

const BMI_CATS: [limit: number, label: string, tone: 'ok' | 'warn' | 'bad'][] = [
  [18.5, 'Zayıf', 'warn'],
  [25, 'Normal', 'ok'],
  [30, 'Fazla kilolu', 'warn'],
  [35, 'Obez, sınıf I', 'bad'],
  [40, 'Obez, sınıf II', 'bad'],
  [99, 'Obez, sınıf III', 'bad'],
]

export interface CalcInput {
  sex: Sex | ''
  age: number | null
  heightCm: number | null
  weightKg: number | null
  activity: number
  goalDelta: number
  phys: Phys
  formula: FormulaId
}

export interface CalcResult {
  bmi: number
  idealLo: number
  idealHi: number
  adult: boolean
  category?: string
  tone?: 'ok' | 'warn' | 'bad'
  infant: boolean
  formula?: Exclude<FormulaId, 'auto'>
  bmr?: number
  tdee?: number
  adj?: number
  target?: number
  weeklyKg?: number | null
  warns: string[]
}

/** Eski uygulamadaki calc() fonksiyonunun TypeScript karşılığı */
export function calculate(p: CalcInput): CalcResult | null {
  const { age, heightCm, weightKg } = p
  if (age == null || heightCm == null || weightKg == null) return null
  if (!(age >= 0) || !(heightCm >= 50) || !(weightKg >= 2) || !p.sex) return null
  const person: Person = { sex: p.sex, age, heightCm, weightKg }
  const male = p.sex === 'E'
  const hm = heightCm / 100
  const index = bmi(weightKg, heightCm)
  const adult = age >= 18
  const r: CalcResult = {
    bmi: index,
    idealLo: 18.5 * hm * hm,
    idealHi: 24.9 * hm * hm,
    adult,
    infant: false,
    warns: [],
  }
  if (adult) {
    const c = BMI_CATS.find((c) => index < c[0])!
    r.category = c[1]
    r.tone = c[2]
  }
  if (age < 1) {
    r.infant = true
    return r
  }
  let f: Exclude<FormulaId, 'auto'> = p.formula === 'auto' ? (age < 18 ? 'schofield' : 'mifflin') : p.formula
  if (age < 18) f = 'schofield'
  r.formula = f
  r.bmr = f === 'schofield' ? bmrSchofield(person) : f === 'harris' ? bmrHarris(person) : bmrMifflin(person)
  r.tdee = r.bmr * p.activity

  const phys: Phys = !male && adult ? p.phys : 'none'
  let adj = 0
  if (phys === 'g2') adj = 340
  else if (phys === 'g3') adj = 452
  else if (phys === 'emz') adj = 330
  else if (adult) adj = p.goalDelta || 0
  r.adj = adj
  r.target = Math.round((r.tdee + adj) / 10) * 10
  const pregnantOrNursing = phys.startsWith('g') || phys === 'emz'
  r.weeklyKg = adult && !pregnantOrNursing ? (adj * 7) / 7700 : null

  const min = male ? 1500 : 1200
  if (adult && r.target < min)
    r.warns.push(`Hedef enerji ${min} kcal altında. Uzun süreli uygulama önerilmez, hedefi düşürmeden önce klinik değerlendirme yapın.`)
  if (!adult)
    r.warns.push('18 yaş altında kalori hedefi büyümeye göre ayarlanmalıdır. Kilo verme hedefi uygulanmaz, değer yaklaşık bir başlangıç noktasıdır.')
  if (age < 3)
    r.warns.push('0–3 yaş aralığında Schofield denklemi sınırlı güvenilirliktedir. Büyüme eğrilerini ve güncel EER tablolarını kullanın.')
  if (phys === 'g1') r.warns.push('Gebeliğin ilk trimesterinde ek enerji önerilmez.')
  if (adult && adj < 0 && r.bmi < 18.5 && !phys.startsWith('g')) r.warns.push('BKİ 18,5 altındayken kilo verme hedefi seçilmiş.')
  return r
}

/** Makro dağılımı: karbonhidrat ve protein yüzdesinden gram hesabı (yağ kalan) */
export function macros(target: number, carbPct: number, proteinPct: number) {
  const fatPct = Math.max(0, 100 - carbPct - proteinPct)
  return {
    carbPct,
    proteinPct,
    fatPct,
    carbG: (target * carbPct) / 100 / 4,
    proteinG: (target * proteinPct) / 100 / 4,
    fatG: (target * fatPct) / 100 / 9,
  }
}

/** Günlük sodyum üst sınırı (mg) */
export function sodiumLimit(ageYears: number, target: number): number {
  return ageYears >= 14 ? 2000 : Math.min(2000, Math.round(target / 100) * 100)
}