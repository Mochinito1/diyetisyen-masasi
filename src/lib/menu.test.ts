import { describe, expect, it } from 'vitest'
import type { Food } from './foods'
import { makeItem, menuTSV, searchForMenu, totals } from './menu'
import { unitsFor } from './units'

const ekmek: Food = { id: 'e', code: '1', name: 'Ekmek, beyaz', sci: '', local: '', groups: [0], v: { 0: 250, 4: 8, 6: 1, 7: 50, 8: 3, 22: 400 } }
const yag: Food = { id: 'y', code: '2', name: 'Zeytinyağı', sci: '', local: '', groups: [1], v: { 0: 900, 6: 100 } }
const groups = ['Tahıl', 'Sıvı ve katı yağlar']
const byCode = new Map([ekmek, yag].map((f) => [f.code, f]))
const idx = { 'Sodyum, Na': 22 }

describe('ev ölçüleri', () => {
  it('ekmek dilimleri ve gram', () => {
    const u = unitsFor('Ekmek, beyaz')
    expect(u[0]).toEqual({ u: 'orta boy dilim', g: 30 })
    expect(u[u.length - 1]).toEqual({ u: 'g', g: 1 })
  })
  it('yağ grubu için varsayılan kaşıklar', () => {
    expect(unitsFor('Zeytinyağı', 'Sıvı ve katı yağlar')[0].u).toBe('yemek kaşığı')
  })
  it('tanımsız besinde yalnızca gram', () => {
    expect(unitsFor('Bilinmeyen', '')).toEqual([{ u: 'g', g: 1 }])
  })
})

describe('menü', () => {
  it('2 dilim ekmek = 60 g', () => {
    const it = makeItem(ekmek, groups, 2, 'orta boy dilim', 'Kahvaltı')
    expect(it.g).toBe(60)
  })
  it('geçersiz ölçü grama düşer, miktar 0 ise varsayılan', () => {
    const it = makeItem(ekmek, groups, 0, 'yok', 'Öğle')
    expect(it).toMatchObject({ u: 'g', q: 100, g: 100 })
  })
  it('toplamlar 100 g başına değerden hesaplanır', () => {
    const items = [makeItem(ekmek, groups, 60, 'g', 'Öğle'), makeItem(yag, groups, 1, 'yemek kaşığı', 'Öğle')]
    const T = totals(items, byCode, idx)
    expect(Math.round(T.kcal)).toBe(150 + 90)
    expect(Math.round(T.na)).toBe(240)
  })
  it('aksansız arama ve sıralama', () => {
    expect(searchForMenu([ekmek, yag], 'zeytinyagi').map((f) => f.code)).toEqual(['2'])
    expect(searchForMenu([ekmek, yag], '')).toEqual([])
  })
  it('TSV başlık ve satır', () => {
    const tsv = menuTSV([makeItem(ekmek, groups, 2, 'orta boy dilim', 'Kahvaltı')], byCode).split('\n')
    expect(tsv).toHaveLength(2)
    expect(tsv[1].startsWith('Kahvaltı\tEkmek, beyaz\t2 orta boy dilim\t60')).toBe(true)
  })
})