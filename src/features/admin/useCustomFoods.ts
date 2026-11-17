import { useState } from 'react'
import type { CustomFood } from '../../lib/customFoods'
import { load, save } from '../../lib/storage'

export const CUSTOM_FOODS_KEY = 'dm.customFoods'
export const FOODS_CHANGED = 'dm-foods-changed'

export function useCustomFoods() {
  const [list, setList] = useState<CustomFood[]>(() => load<CustomFood[]>(CUSTOM_FOODS_KEY, []))
  const commit = (next: CustomFood[]) => {
    setList(next)
    save(CUSTOM_FOODS_KEY, next)
    window.dispatchEvent(new Event(FOODS_CHANGED))
  }
  return {
    list,
    add: (f: Omit<CustomFood, 'id'>[]) => commit([...f.map((x) => ({ ...x, id: crypto.randomUUID().slice(0, 8) })), ...list]),
    remove: (id: string) => commit(list.filter((f) => f.id !== id)),
  }
}