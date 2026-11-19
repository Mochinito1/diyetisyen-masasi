import { describe, expect, it } from 'vitest'
import { autoGoal, validTarget, weeksToGoal } from './goalPlan'

describe('autoGoal', () => {
  it('çok kilo verilecekse −500 kcal', () => expect(autoGoal(90, 75)).toMatchObject({ goal: '-500', phase: 'lose' }))
  it('az kilo verilecekse −250 kcal', () => expect(autoGoal(78, 75)).toMatchObject({ goal: '-250', phase: 'lose' }))
  it('çok kilo alınacaksa +500 kcal', () => expect(autoGoal(50, 56)).toMatchObject({ goal: '500', phase: 'gain' }))
  it('az kilo alınacaksa +250 kcal', () => expect(autoGoal(50, 52)).toMatchObject({ goal: '250', phase: 'gain' }))
  it('hedefe yaklaşınca stabilizasyon', () => {
    expect(autoGoal(75.3, 75)).toMatchObject({ goal: '0', phase: 'stabilize' })
    expect(autoGoal(74.6, 75)).toMatchObject({ goal: '0', phase: 'stabilize' })
    expect(autoGoal(75, 75).phase).toBe('stabilize')
  })
  it('hedefi geçince de stabilizasyon yerine alma önerir', () => expect(autoGoal(72, 75)).toMatchObject({ goal: '250', phase: 'gain' }))
})

describe('weeksToGoal', () => {
  it('−500 kcal ile 10 kg yaklaşık 22 hafta', () => expect(weeksToGoal(10, -500)).toBe(22))
  it('stabilizasyonda süre yok', () => expect(weeksToGoal(0.3, 0)).toBeNull())
})

describe('validTarget', () => {
  it('makul aralık', () => {
    expect(validTarget(70)).toBe(true)
    expect(validTarget(10)).toBe(false)
    expect(validTarget(null)).toBe(false)
    expect(validTarget(NaN)).toBe(false)
  })
})
