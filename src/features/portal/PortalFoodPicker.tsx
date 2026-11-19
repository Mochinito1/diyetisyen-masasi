import { useState } from 'react'
import { C, type Food } from '../../lib/foods'
import { fmt, parseNum } from '../../lib/format'
import { foodUnits, makeItem, portion, searchForMenu, shortName, type Meal, type MenuItem } from '../../lib/menu'
import type { useFoodData } from '../../lib/useFoodData'

type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>

const field = 'h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none'

/** Danışan: menüde olmayan, o öğünde yenen bir besini bugün için kaydeder */
export default function PortalFoodPicker({ food, hidden, meal, onAdd, onClose }: {
  food: FoodCtx
  hidden: (f: Food) => boolean
  meal: Meal
  onAdd: (item: MenuItem) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Food | null>(null)
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('g')

  const results = searchForMenu(food.foods, q, 8, hidden)
  const units = picked ? foodUnits(picked, food.groups) : []
  const draft = picked ? makeItem(picked, food.groups, parseNum(qty) ?? 0, unit, meal) : null
  const t = picked && draft ? portion(picked, draft.g) : null

  const pick = (f: Food) => {
    const L = foodUnits(f, food.groups)
    setPicked(f)
    setUnit(L[0].u)
    setQty(L[0].u === 'g' ? '100' : '1')
  }

  return (
    <div className="mt-2 rounded-xl border border-brand-500 bg-brand-50 p-3">
      <div className="flex items-center gap-2">
        <h3 className="mr-auto text-sm font-bold">Menüde olmayan bir şey yedim</h3>
        <button className="h-8 rounded-lg px-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100" onClick={onClose}>Vazgeç</button>
      </div>
      <input className={`${field} mt-2`} placeholder="Ne yedin? Besin veya yemek ara…" value={q} autoFocus onChange={(e) => { setQ(e.target.value); setPicked(null) }} />

      {!picked && q.trim() && (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 && <p className="text-sm text-stone-500">Eşleşen besin yok.</p>}
          {results.map((f) => (
            <button key={f.id} onClick={() => pick(f)} className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left hover:border-brand-500">
              <b className="block text-sm">{shortName(f.name)}</b>
              <span className="text-xs text-stone-500">{f.portion ? `1 porsiyon ≈ ${fmt(((f.v[C.kcal] ?? 0) * f.portion) / 100)} kcal` : `${fmt(f.v[C.kcal] ?? 0)} kcal / 100 g`}</span>
            </button>
          ))}
        </div>
      )}

      {picked && draft && t && (
        <div className="mt-3">
          <b className="text-sm">{shortName(picked.name)}</b>
          <div className="mt-2 grid grid-cols-[5.5rem_1fr] gap-2">
            <label className="block text-xs font-semibold">Miktar
              <input className={`${field} mt-1`} inputMode="decimal" maxLength={6} value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ''))} />
            </label>
            <label className="block text-xs font-semibold">Ölçü
              <select className={`${field} mt-1`} value={unit} onChange={(e) => { setUnit(e.target.value); setQty(e.target.value === 'g' ? '100' : '1') }}>
                {units.map((x) => <option key={x.u} value={x.u}>{x.u === 'g' ? 'gram' : `${x.u} (${x.g} g)`}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-2 text-sm"><b>{fmt(draft.g)} g</b> · {fmt(t.kcal)} kcal · P {fmt(t.p, 1)} · K {fmt(t.c, 1)} · Y {fmt(t.f, 1)}</p>
          <button className="mt-3 h-10 w-full rounded-xl bg-brand-500 font-semibold text-white" onClick={() => onAdd(draft)}>Bugün yediklerime ekle</button>
        </div>
      )}
    </div>
  )
}
