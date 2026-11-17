import { useEffect, useRef, useState } from 'react'
import { CONDITIONS, CONDITION_GROUPS } from '../../lib/rules'
import type { Client } from './types'

const field = 'flex min-h-[42px] w-full items-center gap-2 rounded-[7px] border border-stone-300 bg-stone-50 px-3 py-2 text-left focus:border-brand-500 focus:outline-none'

/** Seçilebilir koşul grupları (otomatik olanlar, örn. gebelik, listede yok) */
export const SELECT_GROUPS = CONDITION_GROUPS.filter((g) => CONDITIONS.some((c) => c.group === g && !c.auto))

/** Hangi gruplar yanıtlandı? Eski kayıtlarda (tek "seçim yapıldı" bayrağı) bayraktan türetilir. */
export function groupsDone(c: Pick<Client, 'conds' | 'condsDone' | 'condsSet'>): string[] {
  if (c.condsDone) return c.condsDone
  if (c.condsSet) return SELECT_GROUPS
  return SELECT_GROUPS.filter((g) => CONDITIONS.some((x) => x.group === g && c.conds.includes(x.id)))
}

/**
 * Bir koşul grubu için açılır liste (çoklu seçim). Başta "Bilinmiyor"; "Yok" o gruptaki seçimleri temizler
 * ve grubu "yok" olarak işaretler.
 */
function GroupSelect({ group, conds, done, onChange }: { group: string; conds: string[]; done: string[]; onChange: (conds: string[], done: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const items = CONDITIONS.filter((c) => c.group === group && !c.auto)
  const ids = items.map((c) => c.id)
  const answered = done.includes(group)
  const picked = items.filter((c) => conds.includes(c.id))

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const markDone = () => (answered ? done : [...done, group])
  const toggle = (id: string) => onChange(conds.includes(id) ? conds.filter((x) => x !== id) : [...conds, id], markDone())
  const none = () => onChange(conds.filter((x) => !ids.includes(x)), markDone())

  const box = (on: boolean) => (
    <span className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border-[1.5px] ${on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-400'}`} aria-hidden="true">
      {on && <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5l2.5 2.5L10 3.5" /></svg>}
    </span>
  )

  return (
    <div ref={ref} className="relative">
      <button type="button" className={field} aria-label={group} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {picked.length > 0 ? picked.map((c) => (
            <span key={c.id} className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">{c.name}</span>
          )) : answered ? <span>Yok</span> : <span className="text-stone-500">Bilinmiyor</span>}
        </span>
        <span className="text-stone-500" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div role="listbox" aria-multiselectable="true" className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-[10px] border border-stone-200 bg-white shadow-lg">
          <button type="button" role="option" aria-selected={answered && picked.length === 0} onClick={none} className="flex w-full items-center gap-2.5 border-b border-stone-200 px-3 py-2.5 text-left font-semibold hover:bg-stone-100">
            {box(answered && picked.length === 0)} Yok
          </button>
          {items.map((c) => (
            <button key={c.id} type="button" role="option" aria-selected={conds.includes(c.id)} onClick={() => toggle(c.id)} className="flex w-full items-center gap-2.5 border-b border-stone-100 px-3 py-2.5 text-left last:border-0 hover:bg-stone-100">
              {box(conds.includes(c.id))} {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Hastalık ve diyet seçimi: her grup için ayrı açılır liste */
export default function ConditionsSelect({ client, onChange }: { client: Pick<Client, 'conds' | 'condsDone' | 'condsSet'>; onChange: (conds: string[], condsDone: string[]) => void }) {
  const done = groupsDone(client)
  return (
    <div className="space-y-3">
      {SELECT_GROUPS.map((g) => (
        <div key={g}>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">{g}</div>
          <GroupSelect group={g} conds={client.conds} done={done} onChange={onChange} />
        </div>
      ))}
    </div>
  )
}