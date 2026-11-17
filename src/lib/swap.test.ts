import { describe, expect, it } from 'vitest'
import data from '../data/turkomp.json'
import { toFoods, type FoodData } from './foods'
import { portion } from './menu'
import { macroShare, swapCandidates, swapItem } from './swap'

const d = data as unknown as FoodData
const foods = toFoods(d)
const by = (name: string) => foods.find((f) => f.name.startsWith(name))!

describe('öğün değişimi', () => {
  it('makro payları toplamı 1', () => {
    const s = macroShare(by('Ekmek, beyaz'))
    expect(s[0] + s[1] + s[2]).toBeCloseTo(1, 5)
  })

  it('adaylar: kendisi yok, aynı grup, en çok 12', () => {
    const old = by('Ekmek, beyaz')
    const c = swapCandidates(foods, old, '')
    expect(c.length).toBeGreaterThan(0)
    expect(c.length).toBeLessThanOrEqual(12)
    expect(c.every((f) => f.code !== old.code && f.groups[0] === old.groups[0])).toBe(true)
  })

  it('arama aksansız çalışır ve kendisini listelemez', () => {
    const old = by('Ekmek, beyaz')
    const c = swapCandidates(foods, old, 'cavdar')
    expect(c.length).toBeGreaterThan(0)
    expect(c.every((f) => f.code !== old.code)).toBe(true)
  })

  it('"aynı gram" gramı korur', () => {
    const O = by('Ekmek, beyaz')
    const F = by('Çavdar unu')
    const r = swapItem({ code: O.code, g: 60, meal: 'Öğle', u: 'g', q: 60 }, O, F, d.groups, 'same')
    expect(r.code).toBe(F.code)
    expect(r.meal).toBe('Öğle')
    expect(Math.abs(r.g - 60)).toBeLessThanOrEqual(15) // en yakın ev ölçüsüne yuvarlanır
  })

  it('"enerjiyi koru" enerjiyi yaklaşık korur', () => {
    const O = by('Ekmek, beyaz')
    const F = by('Çavdar unu')
    const old = { code: O.code, g: 100, meal: 'Öğle' as const, u: 'g', q: 100 }
    const r = swapItem(old, O, F, d.groups, 'kcal')
    const before = portion(O, old.g).kcal
    const after = portion(F, r.g).kcal
    expect(Math.abs(after - before) / before).toBeLessThan(0.25)
  })

  it('"proteini koru" proteini yaklaşık korur', () => {
    const O = by('Ekmek, beyaz')
    const F = by('Çavdar unu')
    const old = { code: O.code, g: 100, meal: 'Öğle' as const, u: 'g', q: 100 }
    const r = swapItem(old, O, F, d.groups, 'prot')
    expect(Math.abs(portion(F, r.g).p - portion(O, old.g).p)).toBeLessThan(3)
  })
})