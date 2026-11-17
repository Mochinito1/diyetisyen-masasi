import { describe, expect, it } from 'vitest'
import { fold, searchFoods, type Food } from './foods'

const foods: Food[] = [
  { id: 'a', name: 'Çavdar unu', sci: '', local: '', groups: [6], v: {} },
  { id: 'b', name: 'Acur', sci: 'Cucumis melo', local: 'Hıtta', groups: [0], v: {} },
]

describe('foods', () => {
  it('Türkçe karakterleri sadeleştirir', () => {
    expect(fold('ŞEKER Çavdar ığ')).toBe('seker cavdar ig')
  })
  it('aksansız arama bulur', () => {
    expect(searchFoods(foods, 'cavdar', null).map((f) => f.id)).toEqual(['a'])
  })
  it('yöresel ada göre arar', () => {
    expect(searchFoods(foods, 'hitta', null).map((f) => f.id)).toEqual(['b'])
  })
  it('gruba göre süzer', () => {
    expect(searchFoods(foods, '', 6).map((f) => f.id)).toEqual(['a'])
  })
})