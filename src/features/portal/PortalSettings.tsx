import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { card, field } from '../../components/ui/styles'
import AnamnesisCard from '../clients/dossier/Anamnesis'
import ConditionsSelect from '../clients/ConditionsSelect'
import KvkkCard from '../clients/KvkkCard'
import ClientPicker from './ClientPicker'
import DietitianPicker from './DietitianPicker'
import PasswordCard from './PasswordCard'
import { usePortalClient } from './usePortalClient'

const SECTIONS = [
  { id: 'dyt', label: 'Diyetisyenim' },
  { id: 'kisisel', label: 'Kişisel Bilgilerim' },
  { id: 'hastalik', label: 'Hastalık ve Diyet Seçimi' },
  { id: 'anamnez', label: 'Anamnez Bilgileri' },
  { id: 'sifre', label: 'Şifre Değişikliği' },
] as const
type Sec = (typeof SECTIONS)[number]['id']

/** Danışan ayarları: diyetisyen, kişisel bilgiler, hastalık/diyet, anamnez ve şifre. KVKK yalnızca henüz onaylanmadıysa sorulur. */
export default function PortalSettings() {
  const { clients, client, choose, update } = usePortalClient()
  const [sec, setSec] = useState<Sec>('dyt')
  if (!client)
    return (
      <>
        <PageTitle title="Ayarlar" sub="Bilgilerin ve hesabın" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</div>
      </>
    )
  return (
    <>
      <PageTitle title="Ayarlar" sub="Bilgilerin ve hesabın" />
      <ClientPicker clients={clients} value={client.id} onChange={choose} />
      <div className="grid items-start gap-4 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
        <nav aria-label="Ayar bölümleri" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:sticky md:top-28 md:flex-col md:gap-1 md:overflow-visible md:rounded-2xl md:border md:border-stone-200 md:bg-white md:p-2 [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={sec === s.id}
              onClick={() => setSec(s.id)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-left text-sm font-semibold md:rounded-xl md:border-0 md:py-2.5 ${sec === s.id ? 'border-brand-500 bg-brand-500 text-white md:bg-brand-50 md:text-brand-500' : 'border-stone-300 bg-white text-stone-600 md:bg-transparent md:hover:bg-stone-100'}`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 max-w-3xl space-y-4">
          {sec === 'dyt' && (
            <div className={card}>
              <h2 className="font-display text-lg font-bold">Diyetisyenim</h2>
              <p className="mb-3 text-xs text-stone-500">İstediğin zaman başka bir diyetisyen seçebilirsin. Menün ve bilgilerin sende kalır; yeni randevuları seçtiğin diyetisyenin takviminden alırsın. Önceki diyetisyende kalan randevular onun takviminde durur.</p>
              <DietitianPicker value={client.dietitian} onChange={(dietitian) => update({ dietitian })} />
            </div>
          )}

          {sec === 'kisisel' && (
            <div className={card}>
              <h2 className="font-display text-lg font-bold">Kişisel Bilgilerim</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold sm:col-span-2">Ad soyad<input className={`${field} mt-1 w-full font-normal`} value={client.name} onChange={(e) => update({ name: e.target.value })} /></label>
                <label className="block text-sm font-semibold">Telefon<input className={`${field} mt-1 w-full font-normal`} inputMode="numeric" placeholder="05XX XXX XX XX" value={client.tel} onChange={(e) => update({ tel: e.target.value.replace(/[^0-9 ]/g, '') })} /></label>
                <label className="block text-sm font-semibold">E-posta<input className={`${field} mt-1 w-full font-normal`} inputMode="email" value={client.email} onChange={(e) => update({ email: e.target.value })} /></label>
              </div>
            </div>
          )}

          {sec === 'hastalik' && (
            <div className={card}>
              <h2 className="font-display text-lg font-bold">Hastalık ve Diyet Seçimi</h2>
              <p className="mb-3 text-xs text-stone-500">Hastalığın veya özel bir diyetin yoksa "Yok" seç; bilmiyorsan olduğu gibi bırak. Besin listesi ve menü bu seçime göre süzülür.</p>
              <ConditionsSelect client={client} onChange={(conds, condsDone) => update({ conds, condsDone })} />
            </div>
          )}

          {sec === 'anamnez' && (
            <AnamnesisCard
              title="Anamnez Bilgileri"
              hint="Diyetisyeninin seni daha iyi tanıması için yaz: başvuru nedenin, kullandığın ilaçlar, alerjilerin ve beslenme alışkanlıkların."
              value={client.an}
              onChange={(an) => update({ an })}
            />
          )}

          {sec === 'sifre' && (
            <>
              <PasswordCard />
              {!client.kvkk.ay && <KvkkCard value={client.kvkk} onChange={(kvkk) => update({ kvkk })} />}
            </>
          )}
        </div>
      </div>    </>
  )
}