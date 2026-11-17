import { describe, expect, it } from 'vitest'
import { bmi, bmrMifflin, calculate, macros, sodiumLimit, type CalcInput } from './formulas'

const base: CalcInput = { sex: 'K', age: 30, heightCm: 165, weightKg: 60, activity: 1.2, goalDelta: 0, phys: 'none', formula: 'auto' }

describe('formulas', () => {
  it('Mifflin-St Jeor erkek', () => {
    expect(bmrMifflin({ sex: 'E', age: 30, heightCm: 180, weightKg: 80 })).toBe(1780)
  })
  it('Mifflin-St Jeor kadın', () => {
    expect(bmrMifflin({ sex: 'K', age: 30, heightCm: 165, weightKg: 60 })).toBe(1320.25)
  })
  it('BKİ', () => {
    expect(Math.round(bmi(70, 175) * 10) / 10).toBe(22.9)
  })
})

describe('calculate', () => {
  it('eksik veride null döner', () => {
    expect(calculate({ ...base, age: null })).toBeNull()
    expect(calculate({ ...base, sex: '' })).toBeNull()
  })
  it('yetişkin kadın: hedef 10 kcal yuvarlanır', () => {
    const r = calculate(base)!
    expect(r.formula).toBe('mifflin')
    expect(r.target).toBe(1580)
    expect(r.category).toBe('Normal')
  })
  it('çocukta Schofield kullanılır ve hedef farkı uygulanmaz', () => {
    const r = calculate({ ...base, age: 8, goalDelta: -500 })!
    expect(r.formula).toBe('schofield')
    expect(r.adj).toBe(0)
    expect(r.warns.length).toBeGreaterThan(0)
  })
  it('bebekte (1 yaş altı) enerji hesaplanmaz', () => {
    expect(calculate({ ...base, age: 0.5 })!.infant).toBe(true)
  })
  it('gebelik 2. trimester +340', () => {
    expect(calculate({ ...base, phys: 'g2' })!.adj).toBe(340)
  })
  it('1200 kcal altı uyarı verir', () => {
    expect(calculate({ ...base, goalDelta: -750 })!.warns.some((w) => w.includes('1200'))).toBe(true)
  })
})

describe('macros ve sodyum', () => {
  it('gram hesabı', () => {
    const m = macros(2000, 50, 20)
    expect(m.fatPct).toBe(30)
    expect(m.carbG).toBe(250)
    expect(m.proteinG).toBe(100)
    expect(Math.round(m.fatG)).toBe(67)
  })
  it('sodyum sınırı', () => {
    expect(sodiumLimit(30, 2000)).toBe(2000)
    expect(sodiumLimit(5, 1200)).toBe(1200)
  })
})