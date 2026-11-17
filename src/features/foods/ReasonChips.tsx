import type { Evaluation } from '../../lib/rules'

const TONE = { hide: 'bg-red-100 text-red-800', warn: 'bg-amber-100 text-amber-800', good: 'bg-emerald-100 text-emerald-800' } as const

/** Uygunluk nedenleri: gizleme, uyarı ve öne çıkarma etiketleri */
export default function ReasonChips({ ev, max }: { ev: Evaluation; max?: number }) {
  const items: [keyof typeof TONE, string][] = [
    ...ev.res.map((r): [keyof typeof TONE, string] => [r.lvl, `${r.cond}: ${r.msg}`]),
    ...ev.safe.map((m): [keyof typeof TONE, string] => ['good', m]),
    ...ev.boost.map((m): [keyof typeof TONE, string] => ['good', m]),
  ]
  if (!items.length) return null
  const shown = max ? items.slice(0, max) : items
  const rest = items.length - shown.length
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {shown.map(([t, m], i) => (
        <span key={i} className={`rounded px-1.5 py-0.5 text-[11px] font-semibold leading-tight ${TONE[t]}`}>{m}</span>
      ))}
      {rest > 0 && <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${TONE.warn}`} title={items.slice(max).map((i) => i[1]).join(' | ')}>+{rest}</span>}
    </div>
  )
}