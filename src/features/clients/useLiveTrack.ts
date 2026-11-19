import { useEffect, useState } from 'react'
import { cloudClientTrack, cloudEnabled } from '../../lib/cloud'
import { load } from '../../lib/storage'
import type { Client, DayTrack } from './types'

/**
 * Danışanın günlük takibini (yenen öğünler, su, menüden farklı yedikleri, fotoğraflar) güncel okur.
 * Diyetisyenin yerel kopyası girişte alındığı için eski kalabilir: bulutta sunucudan, yerel modda saklı kayıttan
 * açılışta, sekmeye dönünce ve 15 saniyede bir yenilenir.
 */
export function useLiveTrack(clientId: string, initial: Record<string, DayTrack>): Record<string, DayTrack> {
  const [trk, setTrk] = useState(initial)
  useEffect(() => {
    let live = true
    const refresh = async () => {
      const t = cloudEnabled
        ? await cloudClientTrack(clientId)
        : (load<Client[]>('dm.clients', []).find((c) => c.id === clientId)?.trk ?? null)
      if (live && t) setTrk(t)
    }
    void refresh()
    const timer = setInterval(() => void refresh(), 15000)
    window.addEventListener('focus', refresh)
    return () => { live = false; clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [clientId])
  return trk
}
