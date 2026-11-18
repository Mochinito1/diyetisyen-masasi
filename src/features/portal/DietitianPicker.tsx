import { useEffect, useState } from 'react'
import { cloudRefreshDietitians } from '../../lib/cloud'
import { listDietitians } from '../../lib/dietitians'
import { loadBrandOf } from '../settings/useBrand'

const field = 'mt-1 w-full rounded-[7px] border border-stone-300 bg-stone-50 px-3 py-2.5 focus:border-brand-500 focus:outline-none'

/** Diyetisyen seçimi; seçildikten sonra da istenildiği zaman değiştirilebilir */
export default function DietitianPicker({ value, onChange }: { value?: string; onChange: (u: string) => void }) {
  const [, setTick] = useState(0)
  // Açılırken ve sekmeye dönülünce sunucudaki güncel diyetisyen listesini al
  useEffect(() => {
    const refresh = () => { void cloudRefreshDietitians().then((ok) => ok && setTick((t) => t + 1)) }
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])
  const list = listDietitians()
  const missing = value && !list.some((d) => d.u === value)
  const b = value ? loadBrandOf(value) : null
  return (
    <div>
      <select className={field} value={value ?? ''} aria-label="Diyetisyen" onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Seçin</option>
        {missing && <option value={value} disabled>@{value} (pasif)</option>}
        {list.map((d) => <option key={d.u} value={d.u}>{d.label}</option>)}
      </select>
      {b && (b.clinic || b.phone || b.web) && (
        <p className="mt-1.5 text-xs text-stone-500">{[b.clinic, b.phone, b.web].filter(Boolean).join(' · ')}</p>
      )}
    </div>
  )
}