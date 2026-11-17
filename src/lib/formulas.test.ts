import { describe, expect, it } from 'vitest'
import { bmi, bmrMifflin } from './formulas'

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