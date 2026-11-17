import PageTitle from '../../components/ui/PageTitle'
import { card, field } from '../../components/ui/styles'
import AnamnesisCard from '../clients/dossier/Anamnesis'
import ConditionsSelect from '../clients/ConditionsSelect'
import KvkkCard from '../clients/KvkkCard'
import ClientPicker from './ClientPicker'
import DietitianPicker from './DietitianPicker'
import PasswordCard from './PasswordCard'
import { usePortalClient } from './usePortalClient'

/** Danışan ayarları: diyetisyen, kişisel bilgiler, hastalık/diyet, anamnez ve şifre. KVKK yalnızca henüz onaylanmadıysa sorulur. */
export default function PortalSettings() {
  const { clients, client, choose, update } = usePortalClient()
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
      <div className="max-w-2xl space-y-4">
        <div className={card}>
          <h2 className="font-display text-lg font-bold">Diyetisyenim</h2>
          <p className="mb-2 text-xs text-stone-500">İstediğin zaman başka bir diyetisyen seçebilirsin. Menün ve bilgilerin sende kalır; yeni randevuları seçtiğin diyetisyenin takviminden alırsın. Önceki diyetisyende kalan randevular onun takviminde durur.</p>
          <DietitianPicker value={client.dietitian} onChange={(dietitian) => update({ dietitian })} />
        </div>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Kişisel Bilgilerim</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">Ad soyad<input className={`${field} mt-1 w-full font-normal`} value={client.name} onChange={(e) => update({ name: e.target.value })} /></label>
            <label className="block text-sm font-semibold">Telefon<input className={`${field} mt-1 w-full font-normal`} inputMode="numeric" placeholder="05XX XXX XX XX" value={client.tel} onChange={(e) => update({ tel: e.target.value.replace(/[^0-9 ]/g, '') })} /></label>
            <label className="block text-sm font-semibold">E-posta<input className={`${field} mt-1 w-full font-normal`} inputMode="email" value={client.email} onChange={(e) => update({ email: e.target.value })} /></label>
          </div>
        </div>

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Hastalık ve Diyet Seçimi</h2>
          <p className="mb-3 text-xs text-stone-500">Hastalığın veya özel bir diyetin yoksa "Yok" seç; bilmiyorsan olduğu gibi bırak. Besin listesi ve menü bu seçime göre süzülür.</p>
          <ConditionsSelect client={client} onChange={(conds, condsDone) => update({ conds, condsDone })} />
        </div>

        <AnamnesisCard
          title="Anamnez Bilgileri"
          hint="Diyetisyeninin seni daha iyi tanıması için yaz: başvuru nedenin, kullandığın ilaçlar, alerjilerin ve beslenme alışkanlıkların."
          value={client.an}
          onChange={(an) => update({ an })}
        />

        <PasswordCard />

        {!client.kvkk.ay && <KvkkCard value={client.kvkk} onChange={(kvkk) => update({ kvkk })} />}
      </div>
    </>
  )
}