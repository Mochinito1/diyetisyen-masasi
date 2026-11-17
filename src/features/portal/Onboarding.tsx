import { useState } from 'react'
import { btnPrimary, card } from '../../components/ui/styles'
import { listDietitians } from '../../lib/dietitians'
import { toCalcInput } from '../calculator/profile'
import ProfileFields from '../calculator/ProfileFields'
import ConditionsSelect from '../clients/ConditionsSelect'
import KvkkCard from '../clients/KvkkCard'
import type { Client } from '../clients/types'
import DietitianPicker from './DietitianPicker'

/** İlk giriş: danışan bilgileri, diyetisyen, hastalık/diyet seçimi ve KVKK onayı (bir kez) */
export default function Onboarding({ client, onDone }: { client: Client; onDone: (c: Client) => void }) {
  const dts = listDietitians()
  const [c, setC] = useState<Client>({ ...client, dietitian: client.dietitian ?? (dts.length === 1 ? dts[0].u : undefined) })
  const inp = toCalcInput(c.profile)
  const ok = c.profile.sex !== '' && inp.age != null && inp.heightCm != null && inp.weightKg != null && !!c.dietitian && !!c.kvkk.ay
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl bg-brand-50 p-5 text-brand-600">
        <h2 className="font-display text-xl font-bold">Hoş geldin, {c.name.split(' ')[0]}</h2>
        <p className="text-sm">Diyetisyeninin sana uygun program hazırlayabilmesi için birkaç bilgiye ihtiyacımız var. Bunu yalnızca bir kez dolduruyorsun, sonra Ayarlar'dan değiştirebilirsin.</p>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-display text-lg font-bold">Bilgilerin</h2>
        <ProfileFields hideFormula value={c.profile} onChange={(profile) => setC({ ...c, profile })} />
        <div className="mt-4 border-t border-stone-100 pt-3">
          <h3 className="font-display text-base font-bold">Hastalık ve diyet seçimi</h3>
          <p className="mb-3 text-xs text-stone-500">Hastalığın veya özel bir diyetin yoksa "Yok" seç; bilmiyorsan olduğu gibi bırak. Besin listesi bu seçime göre süzülür.</p>
          <ConditionsSelect client={c} onChange={(conds, condsDone) => setC({ ...c, conds, condsDone })} />
        </div>
      </div>
      <div className={card}>
        <h2 className="mb-1 font-display text-lg font-bold">Diyetisyenin</h2>
        <p className="mb-2 text-xs text-stone-500">Programını hazırlayacak diyetisyeni seç. Sonra Ayarlar'dan değiştirebilirsin.</p>
        <DietitianPicker value={c.dietitian} onChange={(dietitian) => setC({ ...c, dietitian })} />
      </div>
      {!client.kvkk.ay && <KvkkCard value={c.kvkk} onChange={(kvkk) => setC({ ...c, kvkk })} />}
      <div className="flex items-center gap-3">
        <button className={btnPrimary} disabled={!ok} onClick={() => onDone({ ...c, onb: true })}>Kaydet ve devam et</button>
        {!ok && <span className="text-sm text-stone-500">Cinsiyet, yaş, boy, kilo, diyetisyen ve aydınlatma metni onayı gerekli.</span>}
      </div>
    </div>
  )
}