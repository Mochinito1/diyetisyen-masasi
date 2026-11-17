import { addMonths, dateStr, monthGrid, monthTitle } from '../../lib/appointments'

interface Props {
  month: string
  onMonth: (ym: string) => void
  selected: string | null
  onSelect: (ds: string) => void
  /** Güne işaret sayısı (örneğin randevu adedi) */
  count?: (ds: string) => number
  /** Tıklanamayan günler */
  disabled?: (ds: string) => boolean
  minMonth?: string
  maxMonth?: string
}

const DOW = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function MonthCalendar({ month, onMonth, selected, onSelect, count, disabled, minMonth, maxMonth }: Props) {
  const { lead, days } = monthGrid(month)
  const today = dateStr(new Date())
  const nav = 'rounded-lg border border-stone-300 bg-white px-3 py-1 font-bold hover:bg-stone-100 disabled:opacity-30'
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button className={nav} aria-label="Önceki ay" disabled={!!minMonth && month <= minMonth} onClick={() => onMonth(addMonths(month, -1))}>‹</button>
        <b className="capitalize">{monthTitle(month)}</b>
        <button className={nav} aria-label="Sonraki ay" disabled={!!maxMonth && month >= maxMonth} onClick={() => onMonth(addMonths(month, 1))}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d) => <i key={d} className="py-1 text-xs font-bold not-italic text-stone-500">{d}</i>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const ds = `${month}-${String(i + 1).padStart(2, '0')}`
          const n = count?.(ds) ?? 0
          const off = disabled?.(ds) ?? false
          const on = selected === ds
          return (
            <button
              key={ds}
              disabled={off}
              aria-pressed={on}
              onClick={() => onSelect(ds)}
              className={`relative h-12 rounded-lg border font-semibold ${
                on ? 'border-brand-500 bg-brand-500 text-white' : ds === today ? 'border-brand-500 bg-white' : 'border-stone-200 bg-white hover:bg-stone-100'
              } ${off ? 'cursor-default opacity-30 hover:bg-white' : ''}`}
            >
              {i + 1}
              {n > 0 && (
                <i className={`absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] not-italic ${on ? 'bg-white text-brand-500' : 'bg-brand-500 text-white'}`}>{n}</i>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}