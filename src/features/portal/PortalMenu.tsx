import { useMemo } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { card } from '../../components/ui/styles'
import { todayStr } from '../../lib/appointments'
import { fmt } from '../../lib/format'
import { MEALS, portion, shortName, totals } from '../../lib/menu'
import { useFoodData } from '../../lib/useFoodData'
import ClientPicker from './ClientPicker'
import NextAppointment from './NextAppointment'
import { usePortalClient } from './usePortalClient'

const GLASSES = 8
const KEEP_DAYS = 30

/** Danışanın menüsü: öğün başına "Yedim" tiki ve su takibi (8 bardak ≈ 2 L) */
export default function PortalMenu() {
  const { clients, client, choose, update } = usePortalClient()
  const food = useFoodData()
  const day = todayStr()
  const trk = client?.trk[day] ?? { m: [], su: 0 }
  const T = useMemo(() => (client && food ? totals(client.menu, food.byCode, food.idx) : null), [client, food])

  if (!client)
    return (
      <>
        <PageTitle title="Menü" sub="Diyetisyeninin hazırladığı menü" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</div>
      </>
    )

  const save = (next: { m: string[]; su: number }) => {
    const all = { ...client.trk, [day]: next }
    const keep = Object.keys(all).sort().slice(-KEEP_DAYS)
    update({ trk: Object.fromEntries(keep.map((k) => [k, all[k]])) })
  }
  const toggle = (meal: string) => save({ ...trk, m: trk.m.includes(meal) ? trk.m.filter((x) => x !== meal) : [...trk.m, meal] })

  return (
    <>
      <PageTitle title="Menü" sub="Bugünkü öğünlerini işaretle, suyunu takip et" />
      <ClientPicker clients={clients} value={client.id} onChange={choose} />
      <NextAppointment clientId={client.id} />
      {!food || !T ? <p className="text-stone-500">Yükleniyor…</p> : client.menu.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Diyetisyenin henüz menü hazırlamadı.</div>
      ) : (
        <div className="space-y-4">
          <div className={card}>
            <h2 className="font-display text-lg font-bold">Su takibi</h2>
            <p className="text-xs text-stone-500">Hedef: günde {GLASSES} bardak (yaklaşık 2 litre)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: GLASSES }, (_, i) => (
                <button key={i} aria-label={`${i + 1}. bardak`} aria-pressed={trk.su > i} onClick={() => save({ ...trk, su: trk.su === i + 1 ? i : i + 1 })}
                  className={`h-11 w-11 rounded-full border text-lg font-bold ${trk.su > i ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-400'}`}>{i + 1}</button>
              ))}
              <span className="self-center text-sm font-semibold">{trk.su} / {GLASSES} bardak</span>
            </div>
          </div>
          {MEALS.map((m) => {
            const rows = client.menu.filter((it) => it.meal === m)
            if (!rows.length) return null
            const done = trk.m.includes(m)
            return (
              <div key={m} className={`${card} ${done ? 'border-brand-500' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{m}</h2>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" className="h-5 w-5 accent-brand-500" checked={done} onChange={() => toggle(m)} /> Yedim
                  </label>
                </div>
                {rows.map((it, i) => {
                  const F = food.byCode.get(it.code)
                  if (!F) return null
                  return (
                    <div key={i} className="mt-2 flex justify-between gap-3 border-t border-stone-100 pt-2 text-sm">
                      <span>{shortName(F.name)}</span>
                      <span className="whitespace-nowrap text-stone-500">{it.u === 'g' ? `${fmt(it.g)} g` : `${fmt(it.q, 1)} ${it.u}`} · {fmt(portion(F, it.g).kcal)} kcal</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
          {client.mnote.trim() && <div className={`${card} whitespace-pre-wrap text-sm`}><b>Diyetisyeninden not</b><div className="mt-1">{client.mnote}</div></div>}
        </div>
      )}
    </>
  )
}