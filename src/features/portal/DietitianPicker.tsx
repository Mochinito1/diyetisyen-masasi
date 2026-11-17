import { listDietitians } from '../../lib/dietitians'
import { loadBrandOf } from '../settings/useBrand'

const field = 'mt-1 w-full rounded-[7px] border border-stone-300 bg-stone-50 px-3 py-2.5 focus:border-brand-500 focus:outline-none'

/** Diyetisyen seçimi; seçildikten sonra da istenildiği zaman değiştirilebilir */
export default function DietitianPicker({ value, onChange }: { value?: string; onChange: (u: string) => void }) {
  const list = listDietitians()
  const b = value ? loadBrandOf(value) : null
  return (
    <div>
      <select className={field} value={value ?? ''} aria-label="Diyetisyen" onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Seçin</option>
        {list.map((d) => <option key={d.u} value={d.u}>{d.label}</option>)}
      </select>
      {b && (b.clinic || b.phone || b.web) && (
        <p className="mt-1.5 text-xs text-stone-500">{[b.clinic, b.phone, b.web].filter(Boolean).join(' · ')}</p>
      )}
    </div>
  )
}