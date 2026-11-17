import PageTitle from '../../components/ui/PageTitle'
import { card, field } from '../../components/ui/styles'
import ConditionsCard from '../clients/ConditionsCard'
import KvkkCard from '../clients/KvkkCard'
import { useBrand } from '../settings/useBrand'
import ClientPicker from './ClientPicker'
import { usePortalClient } from './usePortalClient'

/** Danışan ayarları: kişisel bilgiler, hastalık/diyet seçimi ve KVKK onayı */
export default function PortalSettings() {
  const { clients, client, choose, update } = usePortalClient()
  const { brand } = useBrand()
  if (!client)
    return (
      <>
        <PageTitle title="Ayarlar" sub="Bilgilerin ve onayların" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</div>
      </>
    )
  return (
    <>
      <PageTitle title="Ayarlar" sub="Bilgilerin ve onayların" />
      <ClientPicker clients={clients} value={client.id} onChange={choose} />
      <div className="max-w-2xl space-y-4">
        <div className={card}>
          <h2 className="font-display text-lg font-bold">Kişisel bilgiler</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">Ad soyad<input className={`${field} mt-1 w-full font-normal`} value={client.name} onChange={(e) => update({ name: e.target.value })} /></label>
            <label className="block text-sm font-semibold">Telefon<input className={`${field} mt-1 w-full font-normal`} inputMode="numeric" placeholder="05XX XXX XX XX" value={client.tel} onChange={(e) => update({ tel: e.target.value.replace(/[^0-9 ]/g, '') })} /></label>
            <label className="block text-sm font-semibold">E-posta<input className={`${field} mt-1 w-full font-normal`} inputMode="email" value={client.email} onChange={(e) => update({ email: e.target.value })} /></label>
          </div>
        </div>
        <div className={card}>
          <h2 className="font-display text-lg font-bold">Diyetisyenim</h2>
          <p className="text-sm text-stone-500">{brand.name || brand.clinic || 'Diyetisyen bilgisi henüz girilmemiş.'} {brand.phone && `· ${brand.phone}`}</p>
        </div>
        <ConditionsCard client={client} onChange={(conds) => update({ conds })} />
        <KvkkCard value={client.kvkk} onChange={(kvkk) => update({ kvkk })} />
      </div>
    </>
  )
}