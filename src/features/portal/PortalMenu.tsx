import { useMemo, useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { todayStr } from '../../lib/appointments'
import { fmt } from '../../lib/format'
import { MEALS, portion, shortName, totals, type Meal, type MenuItem } from '../../lib/menu'
import { useFoodData } from '../../lib/useFoodData'
import { useEvaluation } from '../foods/useEvaluation'
import { useRemovedFoods } from '../foods/useRemovedFoods'
import PortalRowEditor from './PortalRowEditor'
import PortalFoodPicker from './PortalFoodPicker'
import type { DaySwap, DayTrack } from '../clients/types'
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
  const trk: DayTrack = client?.trk[day] ?? { m: [], su: 0 }
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const T = useMemo(() => (client && food ? totals(client.menu, food.byCode, food.idx) : null), [client, food])

  if (!client)
    return (
      <>
        <PageTitle title="Menü" sub="Diyetisyeninin hazırladığı menü" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</div>
      </>
    )

  const save = (next: DayTrack) => {
    const all = { ...client.trk, [day]: next }
    const keep = Object.keys(all).sort().slice(-KEEP_DAYS)
    update({ trk: Object.fromEntries(keep.map((k) => [k, all[k]])) })
  }
  const toggle = (meal: string) => save({ ...trk, m: trk.m.includes(meal) ? trk.m.filter((x) => x !== meal) : [...trk.m, meal] })

  const hidden = (f: { code: string }) => evalr?.map.get(f.code)?.st === 'hide'
  const sw = trk.sw ?? []
  /** O gün gerçekte yenen kalemler: planın değiştirilen kalemleri yerine yenenler + plan dışı eklenenler */
  const effective = (m: string): MenuItem[] => [
    ...client.menu.filter((it) => it.meal === m && !sw.some((x) => x.meal === m && x.from === it.code)),
    ...sw.filter((x) => x.meal === m).map((x) => x.it),
  ]
  const mealKcal = (m: string) => (food ? Math.round(totals(effective(m), food.byCode, food.idx).kcal) : 0)
  const addSwap = (x: Omit<DaySwap, 'id'>) => save({ ...trk, sw: [...sw.filter((y) => !(x.from && y.meal === x.meal && y.from === x.from)), { ...x, id: crypto.randomUUID() }] })
  const setSwapIt = (id: string, it: MenuItem) => save({ ...trk, sw: sw.map((y) => (y.id === id ? { ...y, it } : y)) })
  const dropSwap = (id: string) => save({ ...trk, sw: sw.filter((y) => y.id !== id) })
  const meals = MEALS.filter((m) => client.menu.some((it) => it.meal === m) || sw.some((x) => x.meal === m))
  const doneCount = meals.filter((m) => trk.m.includes(m)).length
  const eaten = meals.filter((m) => trk.m.includes(m)).reduce((a, m) => a + mealKcal(m), 0)
  const pct = meals.length ? (doneCount / meals.length) * 100 : 0

  return (
    <>
      <PageTitle title="Menü" sub="Bugünkü öğünlerini işaretle; menüden farklı yediysen değiştir ya da ekle" />
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
                  <div className={`flex items-center gap-3 rounded-t-2xl border-b px-4 py-3.5 ${done ? 'border-brand-500/30 bg-brand-500/15' : 'border-stone-200 bg-stone-100'}`}>
                    <span className="h-10 w-1.5 flex-none rounded-full bg-brand-500" aria-hidden="true" />
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight">{m}</h2>
                      <div className="text-xs font-semibold text-stone-500">{effective(m).length} besin · {fmt(mealKcal(m))} kcal</div>
                    </div>
                    <button
                      onClick={() => toggle(m)}
                      aria-pressed={done}
                      className={`ml-auto flex h-9 flex-none items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition ${done ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-500 text-brand-500 hover:bg-brand-50'}`}
                    >
                      <span aria-hidden="true">{done ? '✓' : '○'}</span> Yedim
                    </button>
                  </div>
                  <ul className="px-4 pb-1">
                    {rows.map((it) => {
                      const F = food.byCode.get(it.code)
                      if (!F) return null
                      const rep = sw.find((x) => x.meal === m && x.from === it.code)
                      const RF = rep ? food.byCode.get(rep.it.code) : null
                      const amt = (x: MenuItem) => (x.u === 'g' ? `${fmt(x.g)} g` : `${fmt(x.q, 1)} ${x.u}`)
                      return (
                        <li key={it.code} className="border-t border-stone-100 first:border-t-0">
                          {rep && RF ? (
                            <>
                              <Line name={shortName(F.name)} sub={amt(it)} kcal={fmt(portion(F, it.g).kcal)} struck />
                              <Line name={shortName(RF.name)} sub={`Bugün yediğim · ${amt(rep.it)}`} kcal={fmt(portion(RF, rep.it.g).kcal)} highlight
                                action={<EditBtn open={editing === `s:${rep.id}`} onClick={() => setEditing(editing === `s:${rep.id}` ? null : `s:${rep.id}`)} />} />
                              {editing === `s:${rep.id}` && (
                                <PortalRowEditor food={food} hidden={hidden} item={rep.it} meal={m as Meal} revertLabel="Menüdeki hâline geri dön"
                                  onApply={(next) => { setSwapIt(rep.id, next); setEditing(null) }} onRevert={() => { dropSwap(rep.id); setEditing(null) }} onClose={() => setEditing(null)} />
                              )}
                            </>
                          ) : (
                            <>
                              <Line name={shortName(F.name)} sub={amt(it)} kcal={fmt(portion(F, it.g).kcal)}
                                action={<EditBtn open={editing === `p:${it.code}`} onClick={() => setEditing(editing === `p:${it.code}` ? null : `p:${it.code}`)} />} />
                              {editing === `p:${it.code}` && (
                                <PortalRowEditor food={food} hidden={hidden} item={it} meal={m as Meal}
                                  onApply={(next) => { addSwap({ meal: m, from: it.code, it: next }); setEditing(null) }} onClose={() => setEditing(null)} />
                              )}
                            </>
                          )}
                        </li>
                      )
                    })}
                    {sw.filter((x) => x.meal === m && !x.from).map((x) => {
                      const XF = food.byCode.get(x.it.code)
                      if (!XF) return null
                      const amt = x.it.u === 'g' ? `${fmt(x.it.g)} g` : `${fmt(x.it.q, 1)} ${x.it.u}`
                      return (
                        <li key={x.id} className="border-t border-stone-100">
                          <Line name={shortName(XF.name)} badge="Plan dışı" sub={amt} kcal={fmt(portion(XF, x.it.g).kcal)}
                            action={<EditBtn open={editing === `x:${x.id}`} onClick={() => setEditing(editing === `x:${x.id}` ? null : `x:${x.id}`)} />} />
                          {editing === `x:${x.id}` && (
                            <PortalRowEditor food={food} hidden={hidden} item={x.it} meal={m as Meal} revertLabel="Bu kaydı sil"
                              onApply={(next) => { setSwapIt(x.id, next); setEditing(null) }} onRevert={() => { dropSwap(x.id); setEditing(null) }} onClose={() => setEditing(null)} />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="px-4 pb-3">
                    {adding === m ? (
                      <PortalFoodPicker food={food} hidden={hidden} meal={m as Meal} onClose={() => setAdding(null)}
                        onAdd={(it) => { addSwap({ meal: m, it }); setAdding(null) }} />
                    ) : (
                      <button className="h-9 w-full rounded-xl border border-dashed border-stone-300 text-sm font-semibold text-stone-600 hover:border-brand-500 hover:text-brand-500" onClick={() => { setEditing(null); setAdding(m) }}>+ Menüde olmayan bir şey yedim</button>
                    )}
                  </div>
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

/** Tüm satırlar aynı ızgarayı kullanır: ad ve miktar solda, "Değiştir" düğmesi ve kcal sabit sütunlarda */
function Line({ name, sub, kcal, struck, highlight, badge, action }: { name: string; sub: string; kcal: string; struck?: boolean; highlight?: boolean; badge?: string; action?: React.ReactNode }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_5.5rem_4.25rem] items-center gap-x-2 py-2.5 text-sm ${highlight ? '-mx-2 my-1 rounded-lg bg-brand-500/10 px-2' : ''}`}>
      <div className="min-w-0">
        <b className={`block font-semibold leading-snug ${struck ? 'text-stone-400 line-through' : ''}`}>{name}{badge && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-amber-800">{badge}</span>}</b>
        <span className="text-xs text-stone-500">{sub}</span>
      </div>
      <div>{action}</div>
      <span className={`text-right font-display text-base font-bold tabular-nums ${struck ? 'text-stone-400 line-through' : ''}`}>{kcal}<small className="ml-0.5 font-sans text-[11px] font-semibold text-stone-500">kcal</small></span>
    </div>
  )
}

function EditBtn({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button className={`h-8 w-full rounded-lg border text-xs font-semibold transition ${open ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-stone-300 text-stone-600 hover:border-brand-500 hover:text-brand-500'}`} aria-expanded={open} onClick={onClick}>⇄ Değiştir</button>
  )
}
