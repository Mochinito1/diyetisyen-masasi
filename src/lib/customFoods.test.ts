import { describe, expect, it } from 'vitest'
import data from '../data/turkomp.json'
import { customToFood, parseFoodCsv } from './customFoods'
import type { FoodData } from './foods'

const d = data as unknown as FoodData

describe('özel besinler', () => {
  it('Food nesnesine dönüşür, değerler doğru bileşene gider', () => {
    const f = customToFood({ id: 'x', name: 'Test bar', group: 'Muhtelif gıda', kcal: 400, protein: 20, carb: 40, fat: 15, sodium: 120 }, d)
    expect(f.code).toBe('custom-x')
    expect(f.v[0]).toBe(400)
    expect(f.v[4]).toBe(20)
    expect(f.v[7]).toBe(40)
    expect(f.v[6]).toBe(15)
    expect(d.groups[f.groups[0]]).toBe('Muhtelif gıda')
  })
  it('bilinmeyen grup Muhtelif gıda olur', () => {
    const f = customToFood({ id: 'y', name: 'A', group: 'Yok', kcal: 1, protein: 0, carb: 0, fat: 0 }, d)
    expect(d.groups[f.groups[0]]).toBe('Muhtelif gıda')
  })
  it('CSV: noktalı virgül, virgüllü sayı, eksik satır atlanır', () => {
    const r = parseFoodCsv('Ad;Grup;Kcal;Protein;Karbonhidrat;Yağ\nProtein bar;Muhtelif gıda;380;21,5;40;12\n;;;;;\nBoş;;abc;;;')
    expect(r.foods).toHaveLength(1)
    expect(r.foods[0]).toMatchObject({ name: 'Protein bar', kcal: 380, protein: 21.5, carb: 40, fat: 12 })
    expect(r.skipped).toBe(2)
  })
  it('ad veya kcal sütunu yoksa hata', () => {
    expect(parseFoodCsv('a;b\n1;2').error).toBeDefined()
  })
})