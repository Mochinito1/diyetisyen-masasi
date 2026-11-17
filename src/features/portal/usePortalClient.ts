import { useState } from 'react'
import { load, save } from '../../lib/storage'
import { useClients } from '../clients/useClients'
import type { Client } from '../clients/types'

const KEY = 'dm.asClient'

/** Danışan rolünde "hangi danışan olarak görüntüleniyor" seçimi (gerçek giriş yok, test modu) */
export function usePortalClient() {
  const { clients, upsert } = useClients()
  const [sel, setSel] = useState<string>(() => load<string>(KEY, ''))
  const client = clients.find((c) => c.id === sel) ?? clients[0] ?? null
  return {
    clients,
    client,
    choose: (id: string) => {
      setSel(id)
      save(KEY, id)
    },
    update: (patch: Partial<Client>) => client && upsert({ ...client, ...patch, updated: Date.now() }),
  }
}