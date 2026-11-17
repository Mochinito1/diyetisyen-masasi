import { useState } from 'react'
import { load, save } from '../../lib/storage'
import type { Client } from './types'

const KEY = 'dm.menuClient'

/** Menü ve Besinler sayfalarının ortak "çalışılan danışan" seçimi */
export function useSelectedClient(clients: Client[]) {
  const [sel, setSel] = useState<string>(() => load<string>(KEY, ''))
  const client = clients.find((c) => c.id === sel) ?? clients[0] ?? null
  return {
    client,
    choose: (id: string) => {
      setSel(id)
      save(KEY, id)
    },
  }
}