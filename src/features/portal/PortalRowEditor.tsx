import { useState } from 'react'
import type { Food } from '../../lib/foods'
import { fmt, parseNum } from '../../lib/format'
import { foodUnits, makeItem, portion, shortName, type Meal, type MenuItem } from '../../lib/menu'
import type { useFoodData } from '../../lib/useFoodData'
import SwapPanel from '../menu/SwapPanel'

type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>

const field = 'h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none'

/**
 * Danışan: bir satırın o günkü miktarını (gram/adet/ölçü) değiştirir ya da başka besinle değiştirir.
 * Plan değişmez; sonuç yalnızca bugünün kaydına yazılır.
 */
export default function PortalRowEditor({ food, hidden, item, meal, revertLabel, onApply, onRevert, onClose }: {
  food: FoodCtx
  hidden: (f: Food) => boolean
  /** Şu an geçerli kalem (plandaki ya da bugün için değiştirilmiş) */
  item: MenuItem
  meal: Meal
  /** Değiştirilmiş/ek satırlarda: "Planı geri yükle" ya da "Sil" */
  revertLabel?: string
  onApply: (next: MenuItem) => void
  onRevert?: () => void
  onClose: () => void
}) {
  const F = food.byCode.get(item.code)!
  const units = foodUnits(F, food.groups)
  const [tab, setTab] = useState<'amount' | 'food'>('amount')
  const [unit, setUnit] = useState(units.some((x) => x.u === item.u) ? item.u : 'g')
  const [qty, setQty] = useState(String(item.u === unit ? item.q : unit === 'g' ? item.g : 1).replace('.', ','))
  const draft = makeItem(F, food.groups, parseNum(qty) ?? 0, unit, meal)
  const t = portion(F, draft.g)
  const same = draft.u === item.u && draft.q === item.q

  return (
    <div className="mt-2 rounded-xl border border-brand-500 bg-brand-50 p-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 overflow-hidden rounded-xl border border-stone-300 text-sm font-semibold" role="tablist" aria-label="Değiştirme türü">
          {([['amount', 'Miktarı değiştir'], ['food', 'Başka besin']] as const).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-9 flex-1 px-2 ${tab === k ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}>{label}</button>
          ))}
        </div>
        <button className="h-9 rounded-lg px-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100" onClick={onClose}>Kapat</button>
      </div>

      {tab === 'amount' ? (
        <div className="mt-3">
          <b className="text-sm">{shortName(F.name)}</b>
          <div className="mt-2 grid grid-cols-[5.5rem_1fr] gap-2">
            <label className="block text-xs font-semibold">Miktar
              <input className={`${field} mt-1`} inputMode="decimal" maxLength={6} value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ''))} />
            </label>
            <label className="block text-xs font-semibold">Ölçü
              <select className={`${field} mt-1`} value={unit} onChange={(e) => { const u = e.target.value; setUnit(u); setQty(u === 'g' ? String(item.g) : '1') }}>
                {units.map((x) => <option key={x.u} value={x.u}>{x.u === 'g' ? 'gram' : `${x.u} (${x.g} g)`}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-2 text-sm"><b>{fmt(draft.g)} g</b> · {fmt(t.kcal)} kcal · P {fmt(t.p, 1)} · K {fmt(t.c, 1)} · Y {fmt(t.f, 1)}</p>
          <button className="mt-3 h-10 w-full rounded-xl bg-brand-500 font-semibold text-white disabled:opacity-40" disabled={same || !(parseNum(qty) ?? 0)} onClick={() => onApply(draft)}>Bu miktarı yedim</button>
        </div>
      ) : (
        <div className="mt-3">
          <SwapPanel food={food} hidden={hidden} item={item} onClose={() => setTab('amount')} onApply={(next) => onApply({ ...next, meal })} />
        </div>
      )}

      {onRevert && (
        <button className="mt-3 h-9 w-full rounded-xl border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={onRevert}>{revertLabel ?? 'Geri al'}</button>
      )}
    </div>
  )
}
