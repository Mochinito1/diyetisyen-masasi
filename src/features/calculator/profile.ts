import type { CalcInput, FormulaId, Phys, Sex } from '../../lib/formulas'
import { parseNum } from '../../lib/format'
import { autoGoal, validTarget } from '../../lib/goalPlan'

/** Formdaki ham değerler (metin olarak tutulur, yazarken bozulmasın diye) */
export interface Profile {
  sex: Sex | ''
  age: string
  h: string
  w: string
  act: string
  goal: string
  phys: Phys
  formula: FormulaId
  /** Hedef kilo (kg, metin). Doluysa tempo ve stabilizasyon mevcut kiloya göre otomatik belirlenir; goal yok sayılır. */
  tw?: string
}

export const EMPTY_PROFILE: Profile = { sex: '', age: '', h: '', w: '', act: '1.375', goal: '0', phys: 'none', formula: 'auto' }

/** Geçerli günlük kcal farkı: hedef kilo girildiyse otomatik (tempo ve stabilizasyon), yoksa elle seçilen hedef */
export function effectiveGoal(p: Profile): string {
  const w = parseNum(p.w)
  const tw = p.tw ? parseNum(p.tw) : null
  return w != null && validTarget(tw) ? autoGoal(w, tw).goal : p.goal
}

export function toCalcInput(p: Profile): CalcInput {
  return {
    sex: p.sex,
    age: parseNum(p.age),
    heightCm: parseNum(p.h),
    weightKg: parseNum(p.w),
    activity: parseFloat(p.act),
    goalDelta: parseFloat(effectiveGoal(p)) || 0,
    phys: p.phys,
    formula: p.formula,
  }
}