import { useEffect, useMemo, useRef, useState } from 'react'
import { C, type Food } from '../../lib/foods'
import { fmt, fmtMax } from '../../lib/format'
import { portion, shortName, type MenuItem } from '../../lib/menu'
import { swapCandidates, swapItem, type SwapMode } from '../../lib/swap'
import type { useFoodData } from '../../lib/useFoodData'

type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>

const field = 'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'

const MODES: [SwapMode, string][] = [
  ['kcal', 'Enerjiyi koru'],
  ['prot', 'Proteini koru'],
  ['same', 'Aynı gram'],
]

const amount = (it: MenuItem) => (it.u === 'g' ? `${fmt(it.g)} g` : `${fmtMax(it.q, 2)} ${it.u} · ${fmt(it.g)} g`)

export default function SwapPanel({ food, hidden, item, onApply, onClose }: {
  food: FoodCtx
  hidden: (f: Food) => boolean
  item: MenuItem
  onApply: (next: MenuItem) => void
  onClose: () => void
}) {
  const O = food.byCode.get(item.code)!
  const [mode, setMode] = useState<SwapMode>('kcal')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Food | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  const cands = useMemo(() => swapCandidates(food.foods, O, q, hidden), [food.foods, O, q, hidden])
  const next = sel ? swapItem(item, O, sel, food.groups, mode) : null
  const a = portion(O, item.g)
  const b = next && sel ? portion(sel, next.g) : null

  const row = (label: string, x: number, y: number, d: number) => (
    <tr key={label} className="border-t border-stone-100">
      <td className="py-1">{label}</td>
      <td className="py-1 text-right">{fmt(x, d)}</td>
      <td className="py-1 text-right">{fmt(y, d)}</td>
      <td className="py-1 text-right">{y - x >= 0 ? '+' : '−'}{fmt(Math.abs(y - x), d)}</td>
    </tr>
  )

  return (
    <div ref={ref} className="rounded-2xl border border-brand-500 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Besini değiştir</h2>
          <p className="text-sm text-stone-500"><b>{shortName(O.name)}</b> · {amount(item)} · {fmt(a.kcal)} kcal</p>
        </div>
        <button className={btn} onClick={onClose}>Vazgeç</button>
      </div>

      <div className="mt-3 flex overflow-hidden rounded-lg border border-stone-300 text-sm font-semibold sm:w-96">
        {MODES.map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 ${mode === m ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}>{label}</button>
        ))}
      </div>

      <input className={`${field} mt-3 w-full`} placeholder="Başka besin ara. Boş bırakırsanız benzer besinler önerilir." value={q} onChange={(e) => { setQ(e.target.value); setSel(null) }} />

      <div className="mt-2 space-y-1.5">
        {cands.length === 0 && <p className="text-sm text-stone-500">Öneri bulunamadı, arama yapın.</p>}
        {cands.map((f) => (
          <button key={f.id} onClick={() => setSel(f)} className={`w-full rounded-lg border px-3 py-2 text-left hover:border-brand-500 ${sel?.id === f.id ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
            <b className="block text-sm">{shortName(f.name)}</b>
            <span className="text-xs text-stone-500">
              {fmt(f.v[C.kcal] ?? 0)} kcal · P {fmt(f.v[C.protein] ?? 0, 1)} · K {fmt(f.v[C.carb] ?? 0, 1)} · Y {fmt(f.v[C.fat] ?? 0, 1)} /100 g
            </span>
          </button>
        ))}
      </div>

      {next && sel && b && (
        <div className="mt-4 rounded-xl border border-stone-200 p-3">
          <p className="mb-2 text-sm"><b>Yeni:</b> {shortName(sel.name)} · {amount(next)}</p>
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs uppercase tracking-wide text-stone-500">
              <tr><th></th><th className="py-1 text-right">Önce</th><th className="py-1 text-right">Sonra</th><th className="py-1 text-right">Fark</th></tr>
            </thead>
            <tbody>
              {row('kcal', a.kcal, b.kcal, 0)}
              {row('Protein g', a.p, b.p, 1)}
              {row('Karb. g', a.c, b.c, 1)}
              {row('Yağ g', a.f, b.f, 1)}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <button className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40" disabled={!next} onClick={() => next && onApply(next)}>
          Değiştir
        </button>
      </div>
    </div>
  )
}