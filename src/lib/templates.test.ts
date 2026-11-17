import { describe, expect, it } from 'vitest'
import data from '../data/turkomp.json'
import { toFoods, type FoodData } from './foods'
import { compIndex } from './menu'
import { TEMPLATES, buildTemplate, recommendTemplate } from './templates'

const d = data as unknown as FoodData
const foods = toFoods(d)
const ctx = { byCode: new Map(foods.map((f) => [f.code, f])), groups: d.groups, idx: compIndex(d), macro: { c: 50, p: 20 } }

describe('şablonlar', () => {
  it('tüm besin kodları TürKomp verisinde bulunur', () => {
    const missing: string[] = []
    for (const t of TEMPLATES)
      for (const [, codes] of t.items)
        for (const c of Array.isArray(codes) ? codes : [codes]) if (!ctx.byCode.has(c)) missing.push(`${t.id}:${c}`)
    expect(missing).toEqual([])
  })

  it('hedef verilmezse şablon olduğu gibi gelir', () => {
    const r = buildTemplate(TEMPLATES[0], null, ctx)
    expect(r.items.length).toBe(TEMPLATES[0].items.length)
    expect(r.skipped).toEqual([])
  })

  for (const target of [1300, 1600, 2040, 2500]) {
    for (const t of TEMPLATES) {
      it(`${t.id} ${target} kcal hedefine yaklaşır`, () => {
        const r = buildTemplate(t, target, ctx)
        expect(Math.abs(r.kcal - target) / target).toBeLessThan(0.05)
        // protein kaynakları menüde kalır
        const prot = r.items.filter((it) => /^(Et |Balık|Yumurta)/.test(d.groups[ctx.byCode.get(it.code)!.groups[0]]))
        expect(prot.length).toBeGreaterThan(0)
      })
    }
  }

  it('sayılabilir birimler tam sayıdır', () => {
    const r = buildTemplate(TEMPLATES[0], 1800, ctx)
    for (const it of r.items) if (/adet|orta boy$/.test(it.u)) expect(Number.isInteger(it.q)).toBe(true)
  })

  it('önerilen şablon', () => {
    expect(recommendTemplate('K', 'g2')).toBe('gebelik')
    expect(recommendTemplate('E', 'none')).toBe('denge')
  })
})