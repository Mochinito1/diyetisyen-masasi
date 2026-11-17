import { card } from '../../components/ui/styles'
import { dateStr, longDate } from '../../lib/appointments'
import { MEALS } from '../../lib/menu'
import type { Client } from './types'

/** Diyetisyen dosyasında: danışanın son 7 gündeki öğün ve su takibi */
export default function PortalTrackCard({ client }: { client: Client }) {
  const planned = MEALS.filter((m) => client.menu.some((it) => it.meal === m))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return dateStr(d)
  })
  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Danışan portalı: son 7 gün</h2>
      {planned.length === 0 ? <p className="mt-2 text-sm text-stone-500">Henüz menü yok.</p> : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-stone-500"><tr><th className="py-1 text-left">Gün</th><th className="text-right">Öğün</th><th className="text-right">Su</th></tr></thead>
            <tbody>
              {days.map((d) => {
                const t = client.trk[d]
                const eaten = t ? t.m.filter((m) => planned.includes(m as never)).length : 0
                return (
                  <tr key={d} className="border-t border-stone-100">
                    <td className="py-1.5 capitalize">{longDate(d)}</td>
                    <td className="text-right tabular-nums">{t ? `${eaten} / ${planned.length}` : '–'}</td>
                    <td className="text-right tabular-nums">{t ? `${t.su} / 8` : '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}