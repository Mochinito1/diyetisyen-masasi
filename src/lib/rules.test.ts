import { describe, expect, it } from 'vitest'
import data from '../data/turkomp.json'
import { toFoods, foodMatch, type FoodData } from './foods'
import { ageRules, activeConditions, evaluateFood, toRuleFood, CONDITIONS } from './rules'

const d = data as unknown as FoodData
const foods = toFoods(d)
const rf = (name: string) => {
  const f = foods.find((x) => x.name.startsWith(name))
  if (!f) throw new Error('bulunamadı: ' + name)
  return toRuleFood(f, d)
}
const none = new Set<string>()
const conds = (ids: string[]) => CONDITIONS.filter((c) => ids.includes(c.id))

describe('kural motoru', () => {
  it('çölyak: ekmek gizlenir, elma uygun', () => {
    expect(evaluateFood(rf('Ekmek, beyaz'), conds(['colyak']), 30, none).st).toBe('hide')
    expect(evaluateFood(rf('Elma'), conds(['colyak']), 30, none).st).toBe('ok')
  })
  it('süt alerjisi: yoğurt gizlenir', () => {
    expect(evaluateFood(rf('Yoğurt'), conds(['sut']), 30, none).st).toBe('hide')
  })
  it('diyabet: toz şeker gizlenir', () => {
    const f = foods.find((x) => /^şeker, beyaz/i.test(x.name))
    if (f) expect(evaluateFood(toRuleFood(f, d), conds(['diyabet']), 30, none).st).toBe('hide')
  })
  it('hipertansiyon: yüksek sodyumlu besin gizlenir', () => {
    const salty = foods.map((f) => toRuleFood(f, d)).find((x) => x.na >= 600)!
    expect(evaluateFood(salty, conds(['hipertansiyon']), 30, none).st).toBe('hide')
  })
  it('gebelik koşulu otomatik: kadın, yetişkin, fizyolojik durum', () => {
    expect(activeConditions([], 'K', 30, 'g2').map((c) => c.id)).toEqual(['gebelik'])
    expect(activeConditions([], 'E', 30, 'g2')).toEqual([])
    expect(activeConditions([], 'K', 30, 'none')).toEqual([])
  })
  it('bebek: bal gizlenir', () => {
    const bal = foods.find((f) => /^bal,/i.test(f.name))
    if (bal) expect(ageRules(toRuleFood(bal, d), 0.5).some((o) => o.lvl === 'hide')).toBe(true)
  })
  it('diyetisyen listeden kaldırınca gizli', () => {
    const f = rf('Elma')
    expect(evaluateFood(f, [], 30, new Set([f.code])).st).toBe('hide')
  })
  it('hiç koşul yokken her şey uygun', () => {
    expect(evaluateFood(rf('Elma'), [], 30, none).st).toBe('ok')
  })
})

describe('eş anlamlı arama', () => {
  it('tavuk piliç etini bulur', () => {
    expect(foods.filter((f) => foodMatch(f, 'tavuk')).some((f) => /^piliç eti/i.test(f.name))).toBe(true)
  })
  it('kıyma dana etini bulur', () => {
    expect(foods.filter((f) => foodMatch(f, 'kıyma')).some((f) => /dana eti/i.test(f.name))).toBe(true)
  })
  it('boş sorgu her şeyi eşler', () => {
    expect(foodMatch(foods[0], '')).toBe(true)
  })
})