import { useRef } from 'react'
import { fmt } from '../../lib/format'
import { macros } from '../../lib/formulas'

export interface Macro { c: number; p: number }

const STEP = 5
const MIN = 5
const COLORS = {
  c: { bar: 'bg-brand-500', dot: 'bg-brand-500', text: 'text-white' },
  p: { bar: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-stone-900' },
  y: { bar: 'bg-rose-400', dot: 'bg-rose-400', text: 'text-stone-900' },
} as const
const PRESETS: [string, Macro][] = [
  ['Dengeli', { c: 50, p: 20 }],
  ['Düşük karbonhidrat', { c: 35, p: 25 }],
  ['Yüksek protein', { c: 40, p: 30 }],
  ['Yüksek karbonhidrat', { c: 60, p: 15 }],
]

const snap = (pct: number) => Math.round(pct / STEP) * STEP
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

/**
 * Makro dağılımı: tek yığın çubuk üzerinde iki tutamaç (karbonhidrat|protein ve protein|yağ sınırı) sürüklenerek ayarlanır.
 * onChange verilmezse salt okunur görünür (danışan profili).
 */
export default function MacroEditor({ target, value, onChange }: { target: number; value: Macro; onChange?: (m: Macro) => void }) {
  const m = macros(target, value.c, value.p)
  const bar = useRef<HTMLDivElement>(null)
  const b1 = m.carbPct
  const b2 = m.carbPct + m.proteinPct
  const edit = !!onChange

  const setBoundary = (which: 1 | 2, pct: number) => {
    if (!onChange) return
    if (which === 1) {
      const c = clamp(snap(pct), MIN, b2 - MIN)
      onChange({ c, p: b2 - c })
    } else {
      const end = clamp(snap(pct), b1 + MIN, 100 - MIN)
      onChange({ c: b1, p: end - b1 })
    }
  }
  const fromEvent = (e: React.PointerEvent) => {
    const r = bar.current!.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * 100
  }
  const handle = (which: 1 | 2, at: number, label: string) => (
    <div
      role="slider" tabIndex={0} aria-label={label} aria-valuemin={MIN} aria-valuemax={95} aria-valuenow={at}
      className="absolute top-1/2 z-10 grid h-9 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      style={{ left: `${at}%` }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setBoundary(which, fromEvent(e)) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setBoundary(which, fromEvent(e)) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setBoundary(which, at - STEP) }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setBoundary(which, at + STEP) }
      }}
    >
      <span className="h-5 w-2 rounded-full border border-stone-300 bg-white shadow-md" />
    </div>
  )

  const step = (k: 'c' | 'p' | 'y', d: number) => {
    if (!onChange) return
    if (k === 'c') onChange({ c: clamp(value.c + d, MIN, 100 - value.p - MIN), p: value.p })
    else if (k === 'p') onChange({ c: value.c, p: clamp(value.p + d, MIN, 100 - value.c - MIN) })
    else onChange({ c: clamp(value.c - d, MIN, 100 - value.p - MIN), p: value.p })
  }

  const items = [
    ['c', 'Karbonhidrat', m.carbG, m.carbPct],
    ['p', 'Protein', m.proteinG, m.proteinPct],
    ['y', 'Yağ', m.fatG, m.fatPct],
  ] as const

  return (
    <div>
      <div ref={bar} className="relative">
        <div className="flex h-7 gap-0.5 overflow-hidden rounded-lg">
          {items.map(([k, name, , pct]) => (
            <div key={k} className={`grid min-w-0 place-items-center text-xs font-bold tabular-nums transition-[width] duration-150 ${COLORS[k].bar} ${COLORS[k].text}`} style={{ width: `${pct}%` }} title={`${name} %${pct}`}>
              {pct >= 12 ? `%${pct}` : ''}
            </div>
          ))}
        </div>
        {edit && handle(1, b1, 'Karbonhidrat ve protein sınırı')}
        {edit && handle(2, b2, 'Protein ve yağ sınırı')}
      </div>
      {edit && <p className="mt-1.5 text-center text-[11px] text-stone-500">Çubuktaki tutamaçları sürükle ya da düğmelerle %5 adımlarla ayarla</p>}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map(([k, name, g, pct]) => (
          <div key={k} className="min-w-0 rounded-lg border border-stone-200 bg-stone-50 p-1.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-600">
              <i className={`inline-block h-2.5 w-2.5 flex-none rounded-full ${COLORS[k].dot}`} />
              <span className="truncate">{k === 'c' ? <><span className="sm:hidden">Karb.</span><span className="hidden sm:inline">Karbonhidrat</span></> : name}</span>
            </div>
            <div className="mt-0.5 font-display text-lg font-bold leading-none tabular-nums">{fmt(g)}<small className="ml-0.5 font-sans text-xs font-semibold text-stone-500">g</small></div>
            <div className="mt-0.5 text-[11px] font-semibold text-stone-500">%{pct}{k === 'y' ? ' (kalan)' : ''}</div>
            {edit && (
              <div className="mt-1.5 flex justify-center gap-1.5">
                <button className="h-6 w-6 rounded-md border border-stone-300 bg-white text-lg font-bold leading-none hover:border-brand-500 hover:text-brand-500" aria-label={`${name} azalt`} onClick={() => step(k, -STEP)}>−</button>
                <button className="h-7 w-7 rounded-lg border border-stone-300 bg-white text-lg font-bold leading-none hover:border-brand-500 hover:text-brand-500" aria-label={`${name} artır`} onClick={() => step(k, STEP)}>+</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {edit && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">Hazır dağılımlar</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map(([label, p]) => {
              const on = p.c === value.c && p.p === value.p
              return (
                <button key={label} aria-pressed={on} onClick={() => onChange!(p)}
                  className={`min-w-0 rounded-lg border px-2 py-1 text-center transition ${on ? 'border-brand-500 bg-brand-50 text-brand-500 ring-1 ring-brand-500' : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-brand-500'}`}>
                  <span className="block truncate text-xs font-bold leading-tight">{label}</span>
                  <span className="block text-[11px] font-semibold tabular-nums opacity-70">{p.c} / {p.p} / {100 - p.c - p.p}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
