import { useEffect, useMemo, useState } from 'react'
import { customToFood, type CustomFood } from './customFoods'
import { toFoods, type Food, type FoodData } from './foods'
import { compIndex } from './menu'
import { toRuleFood } from './rules'
import { load } from './storage'

let cache: Promise<FoodData> | null = null
const loadData = () => (cache ??= import('../data/turkomp.json').then((m) => m.default as unknown as FoodData))

/** TürKomp verisini bir kez yükler; bileşen kullanımına hazır yapıları döndürür. Yönetici besinleri de katılır. */
export function useFoodData() {
  const [data, setData] = useState<FoodData | null>(null)
  const [ver, setVer] = useState(0)
  useEffect(() => {
    loadData().then(setData)
    const bump = () => setVer((v) => v + 1)
    window.addEventListener('dm-foods-changed', bump)
    return () => window.removeEventListener('dm-foods-changed', bump)
  }, [])
  return useMemo(() => {
    if (!data) return null
    const custom = load<CustomFood[]>('dm.customFoods', []).map((c) => customToFood(c, data))
    const foods: Food[] = [...toFoods(data), ...custom]
    const byCode = new Map(foods.map((f) => [f.code, f]))
    const rule = new Map(foods.map((f) => [f.code, toRuleFood(f, data)]))
    return { data, foods, byCode, rule, idx: compIndex(data), groups: data.groups }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ver])
}

export type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>