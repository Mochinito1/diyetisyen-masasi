import { useEffect, useRef, useState } from 'react'
import { CONDITIONS, CONDITION_GROUPS } from '../../lib/rules'

const field = 'flex min-h-[42px] w-full items-center gap-2 rounded-[7px] border border-stone-300 bg-stone-50 px-3 py-2 text-left focus:border-brand-500 focus:outline-none'

/**
 * Hastalık ve diyet seçimi: açılır liste. "Yok" seçilince diğerleri temizlenir; başka bir şey seçilince "Yok" kalkar.
 * `chosen` false ise henüz seçim yapılmamıştır ("Yok" da bir seçimdir).
 */
export default function ConditionsSelect({ conds, chosen, onChange }: { conds: string[]; chosen: boolean; onChange: (conds: string[], chosen: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const selectable = CONDITIONS.filter((c) => !c.auto)
  const toggle = (id: string) => onChange(conds.includes(id) ? conds.filter((x) => x !== id) : [...conds, id], true)
  const names = selectable.filter((c) => conds.includes(c.id))

  const box = (on: boolean) => (
    <span className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border-[1.5px] ${on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-400'}`} aria-hidden="true">
      {on && <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5l2.5 2.5L10 3.5" /></svg>}
    </span>
  )

  return (
    <div ref={ref} className="relative">
      <button type="button" className={field} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {!chosen ? <span className="text-stone-400">Seçin</span> : names.length === 0 ? <span>Yok</span> : names.map((c) => (
            <span key={c.id} className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">{c.short}</span>
          ))}
        </span>
        <span className="text-stone-500" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-auto rounded-[10px] border border-stone-200 bg-white shadow-lg">
          <button type="button" role="option" aria-selected={chosen && conds.length === 0} onClick={() => onChange([], true)} className="flex w-full items-center gap-2.5 border-b border-stone-200 px-3 py-2.5 text-left font-semibold hover:bg-stone-100">
            {box(chosen && conds.length === 0)} Yok
          </button>
          {CONDITION_GROUPS.map((g) => {
            const items = selectable.filter((c) => c.group === g)
            if (!items.length) return null
            return (
              <div key={g}>
                <div className="bg-stone-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-500">{g}</div>
                {items.map((c) => (
                  <button key={c.id} type="button" role="option" aria-selected={conds.includes(c.id)} onClick={() => toggle(c.id)} className="flex w-full items-center gap-2.5 border-b border-stone-100 px-3 py-2.5 text-left hover:bg-stone-100">
                    {box(conds.includes(c.id))} {c.name}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}