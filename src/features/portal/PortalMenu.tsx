import { useMemo } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { todayStr } from '../../lib/appointments'
import { fmt } from '../../lib/format'
import { MEALS, portion, shortName, totals } from '../../lib/menu'
import { useFoodData } from '../../lib/useFoodData'
import ClientPicker from './ClientPicker'
import NextAppointment from './NextAppointment'
import { usePortalClient } from './usePortalClient'

const GLASSES = 8
const KEEP_DAYS = 30
const box = 'rounded-2xl border bg-white'

/** Danışanın menüsü: öğün başına "Yedim" işareti ve su takibi (8 bardak ≈ 2 L). Diyetisyen menüsüyle aynı kart dilini kullanır. */
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

  const meals = MEALS.filter((m) => client.menu.some((it) => it.meal === m))
  const doneCount = meals.filter((m) => trk.m.includes(m)).length
  const mealKcal = (m: string) => (food ? Math.round(totals(client.menu.filter((it) => it.meal === m), food.byCode, food.idx).kcal) : 0)
  const eaten = meals.filter((m) => trk.m.includes(m)).reduce((a, m) => a + mealKcal(m), 0)
  const pct = meals.length ? (doneCount / meals.length) * 100 : 0

  return (
    <>
      <PageTitle title="Menü" sub="Bugünkü öğünlerini işaretle, suyunu takip et" />
      <ClientPicker clients={clients} value={client.id} onChange={choose} />
      <NextAppointment clientId={client.id} />
      {!food || !T ? <p className="text-stone-500">Yükleniyor…</p> : client.menu.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Diyetisyenin henüz menü hazırlamadı.</div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Bugünün özeti: öğün ilerlemesi, kalori ve su */}
          <section className={`${box} border-stone-200 p-4 shadow-sm lg:sticky lg:top-[112px] lg:order-2`} aria-label="Bugünün özeti">
            <div className="grid gap-5">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">Bugün</h2>
                  <span className="text-sm font-semibold text-stone-500">{doneCount} / {meals.length} öğün</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  <b className="font-display text-xl tabular-nums text-stone-900">{fmt(eaten)}</b> kcal yedin
                  <span className="text-stone-500"> · günlük menü toplamı {fmt(T.kcal)} kcal</span>
                </p>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">Su</h2>
                  <span className="text-sm font-semibold text-stone-500">{trk.su} / {GLASSES} bardak</span>
                </div>
                <div className="mt-2 grid grid-cols-8 gap-1.5">
                  {Array.from({ length: GLASSES }, (_, i) => (
                    <button key={i} aria-label={`${i + 1}. bardak`} aria-pressed={trk.su > i} onClick={() => save({ ...trk, su: trk.su === i + 1 ? i : i + 1 })}
                      className={`grid aspect-square min-h-9 place-items-center rounded-xl border text-sm font-bold transition ${trk.su > i ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-brand-500'}`}>{i + 1}</button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-stone-500">Hedef: günde {GLASSES} bardak (yaklaşık 2 litre)</p>
              </div>
            </div>
          </section>

          <div className="min-w-0 space-y-4 lg:order-1">
            {meals.map((m) => {
              const rows = client.menu.filter((it) => it.meal === m)
              const done = trk.m.includes(m)
              return (
                <section key={m} className={`${box} ${done ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`} aria-label={m}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-bold leading-tight">{m}</h2>
                      <div className="text-xs text-stone-500">{rows.length} besin · {fmt(mealKcal(m))} kcal</div>
                    </div>
                    <button
                      onClick={() => toggle(m)}
                      aria-pressed={done}
                      className={`ml-auto flex h-9 flex-none items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition ${done ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-500 text-brand-500 hover:bg-brand-50'}`}
                    >
                      <span aria-hidden="true">{done ? '✓' : '○'}</span> Yedim
                    </button>
                  </div>
                  <ul className="px-4 pb-2">
                    {rows.map((it, i) => {
                      const F = food.byCode.get(it.code)
                      if (!F) return null
                      return (
                        <li key={i} className="flex items-center justify-between gap-3 border-t border-stone-100 py-2.5 text-sm">
                          <div className="min-w-0">
                            <b className="block truncate font-semibold" title={shortName(F.name)}>{shortName(F.name)}</b>
                            <span className="text-xs text-stone-500">{it.u === 'g' ? `${fmt(it.g)} g` : `${fmt(it.q, 1)} ${it.u}`}</span>
                          </div>
                          <span className="flex-none font-display text-base font-bold tabular-nums">{fmt(portion(F, it.g).kcal)}<small className="ml-0.5 font-sans text-[11px] font-semibold text-stone-500">kcal</small></span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}

          {client.mnote.trim() && (
            <section className={`${box} border-stone-200 p-4`}>
              <h2 className="font-display text-lg font-bold">Diyetisyeninden not</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm">{client.mnote}</p>
            </section>
          )}
          </div>
        </div>
      )}
    </>
  )
}
