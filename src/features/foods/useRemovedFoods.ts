import { useState } from 'react'
import { useAuth } from '../../app/auth'
import { load, save } from '../../lib/storage'

const KEY = 'dm.removedFoods'

/**
 * Listeden kaldırılan besinler (kodlar). Kaldırma ve geri alma yetkisi yalnızca yöneticidedir;
 * kaldırılanlar tüm diyetisyenlerde gizlenir (bulut modunda sunucuyla ortak tutulur).
 */
export function useRemovedFoods() {
  const { session, imp } = useAuth()
  const canEdit = session?.kind === 'admin' || !!imp
  const [list, setList] = useState<string[]>(() => load<string[]>(KEY, []))
  const commit = (next: string[]) => {
    if (!canEdit) return
    setList(next)
    save(KEY, next)
  }
  return {
    set: new Set(list),
    canEdit,
    remove: (code: string) => commit([...new Set([...list, code])]),
    restore: (code: string) => commit(list.filter((c) => c !== code)),
    restoreAll: () => commit([]),
  }
}