import { useState } from 'react'
import { btnPrimary, field } from '../../components/ui/styles'
import type { Food } from '../../lib/foods'
import { fmt, fmtVal, parseNum } from '../../lib/format'
import { MEALS, foodUnits, makeItem, portion, type Meal, type MenuItem } from '../../lib/menu'
import type { Evaluation } from '../../lib/rules'
import type { FoodCtx } from '../../lib/useFoodData'
import ReasonChips from './ReasonChips'

const CATS = ['Temel', 'Mineraller', 'Vitaminler ve karotenoidler', 'Şekerler ve tatlandırıcılar', 'Yağ asitleri', 'Amino asitler']

/** Besin ayrıntı penceresi: tüm bileşenler (100 g ve seçili porsiyon) ve menüye ekleme */
export default function FoodDetail({ food, f, ev, portionG, canAdd, onAdd, onClose }: {
  food: FoodCtx
  f: Food
  ev: Evaluation
  portionG: number
  canAdd: boolean
  onAdd: (item: MenuItem) => void
  onClose: () => void
}) {
  const L = foodUnits(f, food.groups)
  const [qty, setQty] = useState(L[0].u === 'g' ? String(portionG) : '1')
  const [unit, setUnit] = useState(L[0].u)
  const [meal, setMeal] = useState<Meal>('Öğle')
  const k = portionG / 100
  const draft = makeItem(f, food.groups, parseNum(qty) ?? 0, unit, meal)
  const tot = portion(f, draft.g)

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-5" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{f.name}</h2>
            <div className="text-xs text-stone-500">{f.groups.map((g) => food.groups[g]).join(' · ')} · TürKomp {f.code}</div>
          </div>
          <button className="ml-auto text-2xl leading-none text-stone-500" aria-label="Kapat" onClick={onClose}>×</button>
        </div>
        {f.sci && <p className="mt-2 text-sm text-stone-500">Bilimsel adı: <i>{f.sci}</i></p>}
        {f.local && <p className="text-sm text-stone-500">Yöresel adlar: {f.local}</p>}
        <ReasonChips ev={ev} />
        <div className="mt-3 max-h-[46vh] overflow-auto rounded-lg border border-stone-200">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
              <tr><th className="px-3 py-2 text-left">Bileşen</th><th className="px-3 py-2 text-right">100 g</th><th className="px-3 py-2 text-right">{fmt(portionG)} g</th></tr>
            </thead>
            <tbody>
              {CATS.map((cat) => {
                const rows = food.data.comps.map((c, i) => ({ c, i })).filter(({ c, i }) => c[2] === cat && f.v[i] != null)
                if (!rows.length) return null
                return [
                  <tr key={cat} className="bg-stone-100"><td colSpan={3} className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-stone-500">{cat}</td></tr>,
                  ...rows.map(({ c, i }) => (
                    <tr key={i} className="border-t border-stone-100">
                      <td className="px-3 py-1.5">{c[0]}</td>
                      <td className="px-3 py-1.5 text-right">{fmtVal(f.v[i])} {c[1]}</td>
                      <td className="px-3 py-1.5 text-right text-stone-500">{fmtVal(f.v[i] * k)}</td>
                    </tr>
                  )),
                ]
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {canAdd && (
            <>
              <label className="w-24 text-xs font-semibold">Miktar<input className={`${field} mt-1 w-full`} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ''))} /></label>
              <label className="min-w-40 flex-1 text-xs font-semibold">Ölçü
                <select className={`${field} mt-1 w-full`} value={unit} onChange={(e) => { setUnit(e.target.value); setQty(e.target.value === 'g' ? String(portionG) : '1') }}>
                  {L.map((x) => <option key={x.u} value={x.u}>{x.u === 'g' ? 'gram' : `${x.u} (${x.g} g)`}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Öğün
                <select className={`${field} mt-1`} value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>{MEALS.map((m) => <option key={m}>{m}</option>)}</select>
              </label>
              <button className={btnPrimary} onClick={() => onAdd(draft)}>Menüye ekle</button>
              <span className="basis-full text-xs text-stone-500">{fmt(draft.g)} g · {fmt(tot.kcal)} kcal</span>
            </>
          )}
          <a className="ml-auto text-sm text-brand-500 underline" href={`https://turkomp.tarimorman.gov.tr/${f.id}`} target="_blank" rel="noopener noreferrer">TürKomp sayfası</a>
        </div>
      </div>
    </div>
  )
}