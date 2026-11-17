import { useState } from 'react'
import { btnPrimary, card } from '../../components/ui/styles'
import { toCalcInput } from '../calculator/profile'
import ProfileFields from '../calculator/ProfileFields'
import ConditionsCard from '../clients/ConditionsCard'
import KvkkCard from '../clients/KvkkCard'
import type { Client } from '../clients/types'

/** İlk giriş: danışan bilgileri, hastalık/diyet seçimi ve KVKK onayı (bir kez) */
export default function Onboarding({ client, onDone }: { client: Client; onDone: (c: Client) => void }) {
  const [c, setC] = useState(client)
  const inp = toCalcInput(c.profile)
  const ok = c.profile.sex !== '' && inp.age != null && inp.heightCm != null && inp.weightKg != null && !!c.kvkk.ay
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl bg-brand-50 p-5 text-brand-600">
        <h2 className="font-display text-xl font-bold">Hoş geldin, {c.name.split(' ')[0]}</h2>
        <p className="text-sm">Diyetisyeninin sana uygun program hazırlayabilmesi için birkaç bilgiye ihtiyacımız var. Bunu yalnızca bir kez dolduruyorsun, sonra Ayarlar'dan değiştirebilirsin.</p>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-display text-lg font-bold">Bilgilerin</h2>
        <ProfileFields value={c.profile} onChange={(profile) => setC({ ...c, profile })} />
      </div>
      <ConditionsCard client={c} onChange={(conds) => setC({ ...c, conds })} />
      <KvkkCard value={c.kvkk} onChange={(kvkk) => setC({ ...c, kvkk })} />
      <div className="flex items-center gap-3">
        <button className={btnPrimary} disabled={!ok} onClick={() => onDone({ ...c, onb: true })}>Kaydet ve devam et</button>
        {!ok && <span className="text-sm text-stone-500">Cinsiyet, yaş, boy, kilo ve aydınlatma metni onayı gerekli.</span>}
      </div>
    </div>
  )
}