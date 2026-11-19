import { useMemo, useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { bmi } from '../../lib/formulas'
import { cloudEnabled } from '../../lib/cloud'
import { fmt, fmtDate, parseNum } from '../../lib/format'
import { fold } from '../../lib/foods'
import CalcResults from '../calculator/CalcResults'
import ProfileFields from '../calculator/ProfileFields'
import { EMPTY_PROFILE, toCalcInput } from '../calculator/profile'
import { EMPTY_ANAMNESIS, fmtDay, lastVisit, latestWeight } from '../../lib/dossier'
import { load, save } from '../../lib/storage'
import type { Appointment } from '../../lib/appointments'
import ConditionsCard from './ConditionsCard'
import { makeClient as blank } from './factory'
import KvkkCard from './KvkkCard'
import PortalTrackCard from './PortalTrackCard'
import AnamnesisCard from './dossier/Anamnesis'
import LabsCard from './dossier/Labs'
import MeasurementsCard from './dossier/Measurements'
import SessionsCard from './dossier/Sessions'
import type { Client } from './types'
import { useClients } from './useClients'

const field =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'


export default function Clients() {
  const { clients, upsert, remove } = useClients()
  // Ana sayfadan "Danışanı aç" / "Yeni danışan" ile gelindiyse editörü doğrudan aç
  const [pending] = useState(() => {
    const id = load<string>('dm.openClient', '')
    if (id) save('dm.openClient', '')
    // Aktif (seçili) danışan varsa Danışan sekmesi onun dosyasıyla açılır; yoksa liste görünür
    return id || load<string>('dm.menuClient', '')
  })
  const [savedMsg, setSavedMsg] = useState(false)
  const [editing, setEditing] = useState<Client | null>(() => (pending === 'new' ? blank() : (clients.find((c) => c.id === pending) ?? null)))
  const [isNew, setIsNew] = useState(pending === 'new')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'upd' | 'name' | 'bmi'>('upd')
  const aps = useMemo(() => load<Appointment[]>('dm.appointments', []), [])

  const rows = useMemo(() => {
    const list = clients.filter((c) => fold(c.name).includes(fold(q.trim())))
    const idx = (c: Client) => {
      const h = parseNum(c.profile.h)
      const w = parseNum(c.profile.w)
      return h && w ? bmi(w, h) : -1
    }
    return [...list].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name, 'tr') : sort === 'bmi' ? idx(b) - idx(a) : b.updated - a.updated,
    )
  }, [clients, q, sort])

  if (editing) {
    const set = (patch: Partial<Client>) => setEditing({ ...editing, ...patch })
    const valid = editing.name.trim().length > 0
    // Kayıtlı hâlinden farklı mı? (tahlil ve güncelleme zamanı danışan/sistem tarafından değişir, karşılaştırmaya girmez)
    const strip = (c: Client | undefined) => JSON.stringify({ ...c, lab: undefined, updated: undefined })
    const dirty = isNew || strip(clients.find((c) => c.id === editing.id)) !== strip(editing)
    return (
      <>
        <button className="mb-3 text-sm font-semibold text-brand-500" onClick={() => setEditing(null)}>
          ← Danışan listesi
        </button>
        <PageTitle title={isNew ? 'Yeni danışan' : editing.name || 'Danışan'} />
        <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:gap-6">
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <div className="order-1 space-y-3 rounded-2xl border border-stone-200 bg-white p-5 lg:order-none">
              <label className="block text-sm font-semibold">
                Ad soyad
                <input className={field} value={editing.name} onChange={(e) => set({ name: e.target.value })} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Telefon
                  <input className={field} inputMode="numeric" placeholder="05XX XXX XX XX" value={editing.tel} onChange={(e) => set({ tel: e.target.value.replace(/[^0-9 ]/g, '') })} />
                </label>
                <label className="block text-sm font-semibold">
                  E-posta
                  <input className={field} inputMode="email" placeholder="ornek@mail.com" value={editing.email} onChange={(e) => set({ email: e.target.value })} />
                </label>
              </div>
            </div>
            <div className="order-2 rounded-2xl border border-stone-200 bg-white p-5 lg:order-none">
              <ProfileFields value={editing.profile} onChange={(p) => set({ profile: p })} />
            </div>
            <div className="order-6 lg:order-none"><ConditionsCard client={editing} onChange={(conds, condsDone) => set({ conds, condsDone })} /></div>
            <div className="order-last lg:order-none"><KvkkCard value={editing.kvkk} onChange={(kvkk) => set({ kvkk })} /></div>
            <div className="order-7 lg:order-none"><AnamnesisCard value={editing.an} onChange={(an) => set({ an })} /></div>
            <div className="order-8 rounded-2xl border border-stone-200 bg-white p-5 lg:order-none">
              <label className="block text-sm font-semibold">
                Genel notlar (tarihsiz, kalıcı)
                <textarea className={`${field} min-h-28`} value={editing.notes} onChange={(e) => set({ notes: e.target.value })} />
              </label>
            </div>
          </div>
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
            <div className="order-3 min-w-0 lg:order-none"><CalcResults input={toCalcInput(editing.profile)} macro={editing.macro} onMacro={(macro) => set({ macro })} /></div>
            <div className="order-4 min-w-0 lg:order-none"><MeasurementsCard
              meas={editing.meas}
              sex={editing.profile.sex}
              heightCm={parseNum(editing.profile.h)}
              onChange={(meas) => {
                const w = latestWeight(meas)
                set({ meas, ...(w != null ? { profile: { ...editing.profile, w: String(w) } } : {}) })
              }}
            /></div>
            <div className="order-5 lg:order-none"><LabsCard clientId={editing.id} labs={editing.lab} sex={editing.profile.sex} /></div>
            <div className="order-9 lg:order-none"><SessionsCard sess={editing.sess} onChange={(sess) => set({ sess })} /></div>
            <div className="order-10 lg:order-none"><PortalTrackCard client={editing} /></div>
          </div>
        </div>
        <div className="sticky bottom-3 mt-6 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow">
          {!valid && <span className="text-sm text-amber-700">Kaydetmek için ad soyad girin.</span>}
          {savedMsg && <span className="text-sm font-semibold text-emerald-700" role="status">✓ Kaydedildi</span>}
          {!isNew && (
            <button
              className="text-sm font-semibold text-red-700"
              onClick={() => {
                if (confirm(`${editing.name} silinsin mi? Bu işlem geri alınamaz.`)) {
                  remove(editing.id)
                  setEditing(null)
                }
              }}
            >
              Danışanı sil
            </button>
          )}
          <span className="ml-auto flex gap-2">
            <button className="rounded-lg border border-stone-300 px-4 py-2 font-semibold" onClick={() => setEditing(null)}>
              {dirty ? 'Kaydetmeden çık' : 'Listeye dön'}
            </button>
            <button
              disabled={!valid}
              className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40"
              onClick={() => {
                // Tahlil sonuçlarını yalnızca danışan ekler: açık dosyadaki eski kopya, danışanın sonradan eklediklerini ezmesin
                const stored = load<Client[]>('dm.clients', []).find((c) => c.id === editing.id)
                const saved = { ...editing, lab: stored?.lab ?? editing.lab, name: editing.name.trim(), updated: Date.now() }
                upsert(saved)
                save('dm.menuClient', saved.id) // kaydedilen danışan aktif danışan olur
                // Kaydettikten sonra aynı danışan dosyasında kal; listeye dönmek için üstteki bağlantı kullanılır
                setEditing(saved)
                setIsNew(false)
                setSavedMsg(true)
                setTimeout(() => setSavedMsg(false), 2200)
              }}
            >
              Kaydet
            </button>
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="Danışanlar" sub={`${clients.length} kayıt. ${cloudEnabled ? 'Veriler Supabase sunucusunda saklanır.' : 'Veriler yalnızca bu tarayıcıda saklanır.'}`} />
        <button
          className="mb-6 rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white"
          onClick={() => { setEditing(blank()); setIsNew(true) }}
        >
          Yeni danışan
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className={`${field} w-full sm:max-w-xs`} placeholder="Danışan ara" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${field} w-auto`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="upd">Son güncellenen</option>
          <option value="name">Ad (A-Z)</option>
          <option value="bmi">BKİ (yüksekten)</option>
        </select>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          {clients.length === 0 ? 'İlk danışanını ekleyerek başla.' : 'Aramanla eşleşen danışan yok.'}
        </div>
      ) : (
        <div className="overflow-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2 text-left">Ad soyad</th>
                <th className="px-3 py-2 text-right">Yaş</th>
                <th className="px-3 py-2 text-right">BKİ</th>
                <th className="px-3 py-2 text-right">Son görüşme</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const h = parseNum(c.profile.h)
                const w = parseNum(c.profile.w)
                return (
                  <tr key={c.id} className="cursor-pointer border-t border-stone-100 hover:bg-stone-50" onClick={() => { setEditing(c); setIsNew(false); save('dm.menuClient', c.id) }}>
                    <td className="px-3 py-3 font-semibold">{c.name}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.profile.age || '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{h && w ? fmt(bmi(w, h), 1) : '—'}</td>
                    <td className="px-3 py-3 text-right text-stone-500">{(() => { const lv = lastVisit(c, aps); return lv ? fmtDay(lv) : fmtDate(c.updated) })()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}