import { useState } from 'react'
import { load, save } from '../../lib/storage'

const KEY = 'dm.removedFoods'

/** Diyetisyenin listeden kaldırdığı besinler (kodlar) */
export function useRemovedFoods() {
  const [list, setList] = useState<string[]>(() => load<string[]>(KEY, []))
  const commit = (next: string[]) => {
    setList(next)
    save(KEY, next)
  }
  return {
    set: new Set(list),
    remove: (code: string) => commit([...new Set([...list, code])]),
    restore: (code: string) => commit(list.filter((c) => c !== code)),
  }
}