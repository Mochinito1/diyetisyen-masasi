import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { btn, btnPrimary, card, field } from '../../components/ui/styles'
import { fmtDay, lastVisit } from '../../lib/dossier'
import { useRole } from '../../app/role'
import { load, save } from '../../lib/storage'
import { removeAccountsOfClient } from '../../lib/auth'
import type { Appointment } from '../../lib/appointments'
import { parseFoodCsv } from '../../lib/customFoods'
import { parseNum } from '../../lib/format'
import { useClients } from '../clients/useClients'
import { useBrand } from '../settings/useBrand'
import { useApplications, type Application } from './useApplications'
import { useCustomFoods } from './useCustomFoods'

const TABS = ['Diyetisyenler', 'Danışanlar', 'Başvurular', 'Besin dosyası', 'Hesap sil'] as const
type Tab = (typeof TABS)[number]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('Diyetisyenler')
  const apps = useApplications()
  const pend = apps.list.filter((a) => a.status === 'pending').length
  return (
    <>
      <PageTitle title="Yönetim" sub="Diyetisyenler, danışanlar, başvurular, besin dosyası" />
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab === t ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-600'}`}>
            {t}{t === 'Başvurular' && pend > 0 ? ` (${pend})` : ''}
          </button>
        ))}
      </div>
      {tab === 'Diyetisyenler' && <Dietitians apps={apps.list} />}
      {tab === 'Danışanlar' && <ClientsTab />}
      {tab === 'Başvurular' && <Applications {...apps} />}
      {tab === 'Besin dosyası' && <FoodFile />}
      {tab === 'Hesap sil' && <DeleteTab apps={apps} />}
    </>
  )
}

function Dietitians({ apps }: { apps: Application[] }) {
  const { brand } = useBrand()
  const { clients } = useClients()
  const { setRole } = useRole()
  const aps = load<Appointment[]>('dm.appointments', [])
  const approved = apps.filter((a) => a.status === 'approved')
  return (
    <div className="grid items-start gap-3 md:grid-cols-2">
      <div className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <b>{brand.name || brand.clinic || 'Diyetisyen (adı girilmemiş)'}</b>
            <div className="text-xs text-stone-500">Bu tarayıcıdaki ana diyetisyen hesabı · {clients.length} danışan · {aps.length} randevu</div>
          </div>
          <button className={btn} onClick={() => setRole('diyetisyen')}>Hesabına gir</button>
        </div>
      </div>
      {approved.map((a) => (
        <div key={a.id} className={card}><b>{a.name}</b><div className="text-xs text-stone-500">{a.title} · onaylı diyetisyen adayı. Eğitim sürümünde tek diyetisyen verisi bulunur; gerçek çok hesaplı kullanım için sunucu gerekir.</div></div>
      ))}
    </div>
  )
}

function ClientsTab() {
  const { clients } = useClients()
  const { setRole } = useRole()
  const aps = load<Appointment[]>('dm.appointments', [])
  if (!clients.length) return <p className="text-stone-500">Henüz danışan yok.</p>
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-3 py-2 text-left">Danışan</th><th className="px-3 py-2 text-left">Durum</th><th className="px-3 py-2 text-left">KVKK</th><th className="px-3 py-2 text-right">Son görüşme</th><th /></tr></thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-t border-stone-100">
              <td className="px-3 py-2 font-semibold">{c.name}</td>
              <td className="px-3 py-2">{c.onb ? 'Portal bilgileri tamam' : 'İlk giriş bekliyor'}</td>
              <td className="px-3 py-2">{c.kvkk.ay ? `Onaylı · ${fmtDay(c.kvkk.ay)}` : 'Onaysız'}</td>
              <td className="px-3 py-2 text-right">{(() => { const lv = lastVisit(c, aps); return lv ? fmtDay(lv) : '–' })()}</td>
              <td className="px-3 py-2 text-right"><button className={btn} onClick={() => { save('dm.asClient', c.id); setRole('danisan') }}>Hesabına gir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ST = { pending: ['İncelemede', 'bg-amber-100 text-amber-800'], approved: ['Onaylandı', 'bg-emerald-100 text-emerald-800'], rejected: ['Reddedildi', 'bg-red-100 text-red-800'] } as const

function Applications({ list, setStatus }: ReturnType<typeof useApplications>) {
  if (!list.length) return <p className="text-stone-500">Başvuru yok.</p>
  return (
    <div className="grid items-start gap-3 md:grid-cols-2">
      {list.map((a) => (
        <div key={a.id} className={card}>
          <div className="flex flex-wrap items-center gap-2">
            <b>{a.name}</b><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ST[a.status][1]}`}>{ST[a.status][0]}</span>
            <span className="ml-auto text-xs text-stone-500">{fmtDay(new Date(a.ts).toISOString().slice(0, 10))}</span>
          </div>
          <div className="mt-1 text-sm">{a.title}</div>
          {a.note && <div className="text-sm text-stone-500">{a.note}</div>}
          {a.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button className={btnPrimary} onClick={() => setStatus(a.id, 'approved')}>Onayla</button>
              <button className={btn} onClick={() => setStatus(a.id, 'rejected')}>Reddet</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FoodFile() {
  const foods = useCustomFoods()
  const [f, setF] = useState({ name: '', group: 'Muhtelif gıda', kcal: '', protein: '', carb: '', fat: '', fiber: '', sodium: '' })
  const [msg, setMsg] = useState('')
  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v })
  const num = (k: keyof typeof f) => parseNum(f[k])
  const valid = f.name.trim() && num('kcal') != null
  const add = () => {
    foods.add([{ name: f.name.trim(), group: f.group, kcal: num('kcal')!, protein: num('protein') ?? 0, carb: num('carb') ?? 0, fat: num('fat') ?? 0, ...(num('fiber') != null ? { fiber: num('fiber')! } : {}), ...(num('sodium') != null ? { sodium: num('sodium')! } : {}) }])
    setF({ ...f, name: '', kcal: '', protein: '', carb: '', fat: '', fiber: '', sodium: '' })
  }
  const input = (k: keyof typeof f, label: string, w = 'w-24') => (
    <label className={`${w} text-xs font-semibold`}>{label}<input className={`${field} mt-1 w-full font-normal`} inputMode={k === 'name' ? 'text' : 'decimal'} value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
  )
  const importCsv = async (file: File | undefined) => {
    if (!file) return
    const r = parseFoodCsv(await file.text())
    if (r.error) return setMsg(r.error)
    foods.add(r.foods)
    setMsg(`${r.foods.length} besin eklendi${r.skipped ? `, ${r.skipped} satır atlandı` : ''}`)
  }
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className={card}>
        <h2 className="font-display text-lg font-bold">Besin ekle</h2>
        <p className="mb-3 text-xs text-stone-500">Eklenen besinler TürKomp listesine katılır ve tüm diyetisyenlerce görülür. Değerler 100 g başınadır.</p>
        <div className="flex flex-wrap items-end gap-3">
          {input('name', 'Besin adı', 'min-w-48 flex-1')}
          <label className="text-xs font-semibold">Grup<select className={`${field} mt-1 block font-normal`} value={f.group} onChange={(e) => set('group', e.target.value)}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></label>
          {input('kcal', 'kcal')}{input('protein', 'Protein g')}{input('carb', 'Karb. g')}{input('fat', 'Yağ g')}{input('fiber', 'Lif g')}{input('sodium', 'Sodyum mg')}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className={btnPrimary} disabled={!valid} onClick={add}>Ekle</button>
          <label className={`${btn} cursor-pointer py-2`}>CSV içe aktar<input type="file" accept=".csv,.txt,text/csv" hidden onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = '' }} /></label>
          {msg && <span className="text-sm text-stone-500" role="status">{msg}</span>}
        </div>
        <p className="mt-2 text-xs text-stone-500">CSV sütunları: ad, grup, kcal, protein, karbonhidrat, yağ, lif, sodyum (ilk satır başlık; ayırıcı ; , veya sekme).</p>
      </div>
      <div className={card}>
        <h2 className="font-display text-lg font-bold">Eklenen besinler ({foods.list.length})</h2>
        {foods.list.length === 0 ? <p className="mt-2 text-stone-500">Henüz besin eklenmedi.</p> : foods.list.map((x) => (
          <div key={x.id} className="mt-2 flex items-center justify-between gap-3 border-t border-stone-100 pt-2 text-sm">
            <span><b>{x.name}</b> <span className="text-stone-500">· {x.group} · {x.kcal} kcal</span></span>
            <button className={btn} onClick={() => foods.remove(x.id)}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const GROUPS = ['Sebze ve sebze ürünleri', 'Et ve et ürünleri', 'Geleneksel gıdalar', 'Meyve ve meyve ürünleri', 'Balık ve su ürünleri', 'İçecekler', 'Tahıl ve tahıl ürünleri', 'Yağlı tohumlar ve kuru baklagiller', 'Sıvı ve katı yağlar', 'Süt ve süt ürünleri', 'Muhtelif gıda', 'Şeker ve şekerli ürünler', 'Özel beslenme amaçlı gıdalar', 'Yumurta ve yumurta ürünleri']

function DeleteTab({ apps }: { apps: ReturnType<typeof useApplications> }) {
  const { clients, remove } = useClients()
  const [msg, setMsg] = useState('')
  const delClient = (id: string, name: string) => {
    if (!confirm(`“${name}” silinsin mi? Profil, menü, ölçümler, tahliller, notlar ve randevular kalıcı olarak kaldırılır. Bu işlem geri alınamaz.`)) return
    remove(id)
    removeAccountsOfClient(id)
    save('dm.appointments', load<Appointment[]>('dm.appointments', []).filter((a) => a.clientId !== id))
    setMsg(`${name} silindi`)
  }
  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Hesap sil</h2>
      <p className="mb-3 text-xs text-stone-500">Silinen hesabın tüm verisi bu tarayıcıdan kaldırılır. Yedeğiniz yoksa geri getirilemez.</p>
      {clients.length === 0 && apps.list.length === 0 && <p className="text-stone-500">Silinecek hesap yok.</p>}
      {clients.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3 border-t border-stone-100 py-2 text-sm"><span>{c.name} <span className="text-stone-500">· danışan</span></span><button className="text-sm font-semibold text-red-700" onClick={() => delClient(c.id, c.name)}>Sil</button></div>
      ))}
      {apps.list.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 border-t border-stone-100 py-2 text-sm"><span>{a.name} <span className="text-stone-500">· başvuru</span></span><button className="text-sm font-semibold text-red-700" onClick={() => confirm('Başvuru silinsin mi?') && apps.remove(a.id)}>Sil</button></div>
      ))}
      {msg && <p className="mt-2 text-sm text-stone-500" role="status">{msg}</p>}
    </div>
  )
}