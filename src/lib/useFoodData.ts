import { useEffect, useMemo, useState } from 'react'
import { toFoods, type Food, type FoodData } from './foods'
import { compIndex } from './menu'
import { toRuleFood } from './rules'

let cache: Promise<FoodData> | null = null
const loadData = () => (cache ??= import('../data/turkomp.json').then((m) => m.default as unknown as FoodData))

/** TürKomp verisini bir kez yükler; bileşen kullanımına hazır yapıları döndürür. */
export function useFoodData() {
  const [data, setData] = useState<FoodData | null>(null)
  useEffect(() => {
    loadData().then(setData)
  }, [])
  return useMemo(() => {
    if (!data) return null
    const foods: Food[] = toFoods(data)
    const byCode = new Map(foods.map((f) => [f.code, f]))
    const rule = new Map(foods.map((f) => [f.code, toRuleFood(f, data)]))
    return { data, foods, byCode, rule, idx: compIndex(data), groups: data.groups }
  }, [data])
}

export type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>