import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { btnPrimary, card, field } from '../../components/ui/styles'
import { fmtDay } from '../../lib/dossier'
import { useApplications } from '../admin/useApplications'
import ConditionsCard from '../clients/ConditionsCard'
import KvkkCard from '../clients/KvkkCard'
import { useBrand } from '../settings/useBrand'
import ClientPicker from './ClientPicker'
import { usePortalClient } from './usePortalClient'

const STATUS = { pending: 'İncelemede', approved: 'Onaylandı', rejected: 'Reddedildi' } as const

/** Danışan ayarları: kişisel bilgiler, hastalık/diyet seçimi, KVKK onayı ve diyetisyen başvurusu */
export default function PortalSettings() {
  const { clients, client, choose, update } = usePortalClient()
  const { brand } = useBrand()
  const apps = useApplications()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  if (!client)
    return (
      <>
        <PageTitle title="Ayarlar" sub="Bilgilerin ve onayların" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</div>
      </>
    )
  const mine = apps.list.filter((a) => a.name === client.name)
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

        <div className={card}>
          <h2 className="font-display text-lg font-bold">Diyetisyen misiniz? Başvurun</h2>
          <p className="mb-3 text-xs text-stone-500">Başvurunuz yönetici panelinde incelenir.</p>
          {mine.map((a) => (
            <div key={a.id} className="mb-2 flex items-center justify-between rounded-lg bg-stone-100 p-3 text-sm">
              <span>{a.title || 'Başvuru'} · {fmtDay(new Date(a.ts).toISOString().slice(0, 10))}</span>
              <b>{STATUS[a.status]}</b>
            </div>
          ))}
          <label className="block text-sm font-semibold">Unvan / diploma bilgisi<input className={`${field} mt-1 w-full font-normal`} placeholder="Örn. Dyt., Ankara Üniv. Beslenme ve Diyetetik" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="mt-3 block text-sm font-semibold">Not<textarea className={`${field} mt-1 min-h-20 w-full font-normal`} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className={`${btnPrimary} mt-3`} disabled={!title.trim()} onClick={() => { apps.add({ name: client.name, title: title.trim(), note: note.trim() }); setTitle(''); setNote('') }}>Başvuru gönder</button>
        </div>
      </div>
    </>
  )
}