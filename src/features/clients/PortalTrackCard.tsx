import { Fragment } from 'react'
import { card } from '../../components/ui/styles'
import { dateStr, longDate } from '../../lib/appointments'
import { MEALS, portion, shortName } from '../../lib/menu'
import { fmt } from '../../lib/format'
import { useFoodData } from '../../lib/useFoodData'
import type { Client } from './types'

/** Diyetisyen dosyasında: danışanın son 7 gündeki öğün ve su takibi */
export default function PortalTrackCard({ client }: { client: Client }) {
  const food = useFoodData()
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
                  <Fragment key={d}>
                  <tr className="border-t border-stone-100">
                    <td className="py-1.5 capitalize">{longDate(d)}</td>
                    <td className="text-right tabular-nums">{t ? `${eaten} / ${planned.length}` : '–'}</td>
                    <td className="text-right tabular-nums">{t ? `${t.su} / 8` : '–'}</td>
                  </tr>
                  {t?.sw && t.sw.length > 0 && food && (
                    <tr>
                      <td colSpan={3} className="pb-2">
                        <ul className="space-y-1 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800">
                          {t.sw.map((x) => {
                            const N = food.byCode.get(x.it.code)
                            const O = x.from ? food.byCode.get(x.from) : null
                            if (!N) return null
                            return (
                              <li key={x.id}>
                                <b>{x.meal}:</b> {O ? `${shortName(O.name)} yerine ` : 'Plan dışı: '}<b>{shortName(N.name)}</b> ({x.it.u === 'g' ? `${fmt(x.it.g)} g` : `${fmt(x.it.q, 1)} ${x.it.u}`}, {fmt(portion(N, x.it.g).kcal)} kcal)
                              </li>
                            )
                          })}
                        </ul>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}