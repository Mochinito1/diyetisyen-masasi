import { useState } from 'react'
import { load, save } from '../../lib/storage'
import type { CustomTemplate } from '../../lib/templates'

const KEY = 'dm.templates'

/** Diyetisyenin kendi şablonları (tarayıcıda saklanır) */
export function useCustomTemplates() {
  const [list, setList] = useState<CustomTemplate[]>(() => load<CustomTemplate[]>(KEY, []))
  const commit = (next: CustomTemplate[]) => {
    setList(next)
    save(KEY, next)
  }
  return {
    list,
    add: (t: CustomTemplate) => commit([t, ...list]),
    remove: (id: string) => commit(list.filter((t) => t.id !== id)),
  }
}