import { field, card } from '../../../components/ui/styles'
import type { Anamnesis } from '../../../lib/dossier'

const FIELDS: [keyof Anamnesis, string, string][] = [
  ['neden', 'Başvuru nedeni ve şikayetler', 'Neden başvurdu, hedefi ne, mevcut şikayetler'],
  ['ilac', 'İlaçlar ve takviyeler', 'Kullandığı ilaçlar, vitamin/mineral takviyeleri'],
  ['alerji', 'Alerji ve intolerans ayrıntısı', 'Tepki türü, hangi besinde, ne zamandır'],
  ['alisk', 'Beslenme alışkanlıkları', 'Öğün düzeni, dışarıda yeme, su tüketimi, sevmediği besinler, uyku, aktivite'],
]

export default function AnamnesisCard({ value, onChange, title = 'Anamnez', hint = 'İlk görüşmede hastalık ve diyet seçiminin ayrıntısını buraya yazın. Danışanla birlikte kaydedilir.' }: { value: Anamnesis; onChange: (a: Anamnesis) => void; title?: string; hint?: string }) {
  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mb-3 text-xs text-stone-500">{hint}</p>
      <div className="space-y-3">
        {FIELDS.map(([k, label, ph]) => (
          <label key={k} className="block text-xs font-bold uppercase tracking-wider text-stone-500">
            {label}
            <textarea className={`${field} mt-1 min-h-20 w-full text-sm font-normal normal-case tracking-normal text-stone-900`} placeholder={ph} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
          </label>
        ))}
      </div>
    </div>
  )
}