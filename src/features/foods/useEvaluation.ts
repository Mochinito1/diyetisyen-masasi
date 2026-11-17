import { useMemo } from 'react'
import { parseNum } from '../../lib/format'
import { activeConditions, evaluateFood, type Evaluation } from '../../lib/rules'
import type { FoodCtx } from '../../lib/useFoodData'
import type { Client } from '../clients/types'

/** Seçili danışana göre tüm besinlerin uygunluğu (danışan yoksa yalnızca "kaldırılanlar" etkili) */
export function useEvaluation(food: FoodCtx | null, client: Client | null, removed: ReadonlySet<string>) {
  return useMemo(() => {
    if (!food) return null
    const age = client ? parseNum(client.profile.age) : null
    const conds = client ? activeConditions(client.conds, client.profile.sex, age, client.profile.phys) : []
    const map = new Map<string, Evaluation>()
    for (const f of food.foods) map.set(f.code, evaluateFood(food.rule.get(f.code)!, conds, age, removed))
    return { map, conds, age }
  }, [food, client, removed])
}