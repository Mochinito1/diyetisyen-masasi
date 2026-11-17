import type { CalcInput, FormulaId, Phys, Sex } from '../../lib/formulas'
import { parseNum } from '../../lib/format'

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
}

export const EMPTY_PROFILE: Profile = { sex: '', age: '', h: '', w: '', act: '1.375', goal: '0', phys: 'none', formula: 'auto' }

export function toCalcInput(p: Profile): CalcInput {
  return {
    sex: p.sex,
    age: parseNum(p.age),
    heightCm: parseNum(p.h),
    weightKg: parseNum(p.w),
    activity: parseFloat(p.act),
    goalDelta: parseFloat(p.goal) || 0,
    phys: p.phys,
    formula: p.formula,
  }
}