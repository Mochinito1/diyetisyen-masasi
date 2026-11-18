import { useCallback, useState } from 'react'
import { useAuth } from '../../app/auth'
import { ownerOfClient } from '../../lib/dietitians'
import { EMPTY_ANAMNESIS } from '../../lib/dossier'
import { load, save } from '../../lib/storage'
import type { Client } from './types'

const KEY = 'dm.clients'

const normalize = (c: Client): Client => ({
  ...c, menu: c.menu ?? [], mnote: c.mnote ?? '', an: { ...EMPTY_ANAMNESIS, ...c.an },
  conds: c.conds ?? [], kvkk: { ay: c.kvkk?.ay ?? '', riza: c.kvkk?.riza ?? '' }, trk: c.trk ?? {},
  meas: c.meas ?? [], lab: c.lab ?? [], sess: c.sess ?? [],
})

/**
 * Danışan kayıtları. Diyetisyen hesabı yalnızca kendi danışanlarını görür; yönetici ve danışan portalı tüm kayıtlara erişir
 * (portal zaten yalnızca oturumdaki danışanın kaydını kullanır).
 */
export function useClients() {
  const { session } = useAuth()
  const [all, setAll] = useState<Client[]>(() => load<Client[]>(KEY, []).map(normalize))

  const commit = useCallback((next: Client[]) => {
    setAll(next)
    save(KEY, next)
  }, [])

  const clients = session?.kind === 'diyetisyen' ? all.filter((c) => ownerOfClient(c) === session.u) : all
  const upsert = (c: Client) => {
    // Diyetisyenin eklediği yeni danışan ona bağlanır
    const mine = session?.kind === 'diyetisyen' && !c.dietitian ? { ...c, dietitian: session.u } : c
    commit(all.some((x) => x.id === mine.id) ? all.map((x) => (x.id === mine.id ? mine : x)) : [mine, ...all])
  }
  const remove = (id: string) => commit(all.filter((c) => c.id !== id))

  return { clients, upsert, remove }
}