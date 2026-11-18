import { useNavigate } from 'react-router-dom'
import { apDay, isBusy, todayStr, type Appointment } from '../lib/appointments'
import { cloudEnabled } from '../lib/cloud'
import { fmt } from '../lib/format'
import { calculate } from '../lib/formulas'
import { save, load } from '../lib/storage'
import { sampleClients } from '../lib/samples'
import { useFoodData } from '../lib/useFoodData'
import { toCalcInput } from '../features/calculator/profile'
import { useClients } from '../features/clients/useClients'
import type { Client } from '../features/clients/types'
import { useSelectedClient } from '../features/clients/useSelectedClient'
import { useEvaluation } from '../features/foods/useEvaluation'
import { useRemovedFoods } from '../features/foods/useRemovedFoods'
import NextAppointment from '../features/portal/NextAppointment'
import { usePortalClient } from '../features/portal/usePortalClient'
import { useBrand } from '../features/settings/useBrand'
import PhotoShowcase from './PhotoShowcase'
import { useRole } from './role'

const TONE = { ok: 'bg-emerald-100 text-emerald-800', warn: 'bg-amber-100 text-amber-800', bad: 'bg-red-100 text-red-800' } as const
const btn = 'inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-semibold hover:border-brand-500 hover:text-brand-500'
const primary = 'inline-flex h-10 items-center justify-center rounded-xl bg-brand-500 px-3.5 text-sm font-semibold text-white hover:brightness-110'

export default function Home() {
  const { role } = useRole()
  return (
    <div>
      <div className="py-4 text-center">
        <h1 className="font-display text-[26px] font-bold leading-tight md:text-[32px]">Diyetisyen Masası</h1>
        <p className="mt-2 text-sm text-stone-500">{cloudEnabled ? 'Eğitim amaçlı: veriler Supabase sunucusunda saklanır, gerçek danışan verisi girmeyin.' : 'Eğitim amaçlı: veriler yalnızca bu tarayıcıda saklanır, gerçek danışan verisi girmeyin.'}</p>
      </div>
      <PhotoShowcase />
      <div className="mt-4">{role === 'danisan' ? <ClientHome /> : <DietitianHome />}</div>
    </div>
  )
}

function ClientHome() {
  const { client } = usePortalClient()
  const nav = useNavigate()
  return (
    <>
      {client ? <NextAppointment clientId={client.id} /> : <p className="mb-4 text-sm text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</p>}
    </>
  )
}

function DietitianHome() {
  const { role } = useRole()
  const nav = useNavigate()
  const { clients, upsert } = useClients()
  const { client } = useSelectedClient(clients)
  const food = useFoodData()
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)
  const r = client ? calculate(toCalcInput(client.profile)) : null
  const open = (id: string) => { save('dm.menuClient', id); save('dm.openClient', id); nav('/danisanlar') }
  const recent = [...clients].sort((a, b) => b.updated - a.updated).slice(0, 4)

  return (
    <>
      {client ? (
        <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex sm:flex-wrap sm:items-center">
          <button className="min-w-0 text-left sm:flex-1 sm:basis-56" onClick={() => open(client.id)} title="Danışan bilgilerini aç">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">Aktif danışan</div>
            <h2 className="mt-0.5 font-display text-lg font-bold hover:text-brand-500">{client.name || 'İsimsiz danışan'}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
              {r?.adult && r.category && <span className={`rounded-full px-2.5 py-0.5 ${TONE[r.tone!]}`}>BKİ {fmt(r.bmi, 1)} · {r.category}</span>}
              {r?.target && <span className={`rounded-full px-2.5 py-0.5 ${TONE.ok}`}>{fmt(r.target)} kcal/gün</span>}
              {evalr?.conds.map((c) => <span key={c.id} className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5">{c.short}</span>)}
            </div>
          </button>
          <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex">
            <button className={primary} onClick={() => open(client.id)}>Danışanı aç</button>
            <button className={btn} onClick={() => nav('/danisanlar')}>Danışan değiştir</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex sm:flex-wrap sm:items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">Aktif danışan</div>
            <h2 className="mt-0.5 font-display text-lg font-bold">Seçili danışan yok</h2>
            <p className="mt-1 text-stone-500">Başlamak için bir danışan açın veya yeni danışan kaydedin.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex">
            <button className={primary} onClick={() => { save('dm.openClient', 'new'); nav('/danisanlar') }}>Yeni danışan</button>
            <button className={btn} onClick={() => nav('/danisanlar')}>Danışanlar</button>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <h2 className="mr-auto font-display text-lg font-bold">Son danışanlar</h2>
          <button className={`${btn} h-9`} onClick={() => nav('/danisanlar')}>Tümü</button>
          <button className={`${btn} h-9`} onClick={() => sampleClients().forEach(upsert)}>+ Örnek danışan</button>
        </div>
        {recent.length === 0 ? <p className="mt-2 text-stone-500">Henüz kayıtlı danışan yok.</p> : (
          <div className="mt-2">
            {recent.map((c) => <RecentRow key={c.id} c={c} onOpen={() => open(c.id)} />)}
          </div>
        )}
      </div>
    </>
  )
}

function RecentRow({ c, onOpen }: { c: Client; onOpen: () => void }) {
  const rr = calculate(toCalcInput(c.profile))
  const nc = c.conds.length
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-2.5 border-b border-stone-200 px-1 py-2.5 text-left last:border-0 hover:bg-stone-100">
      <b className="min-w-0 truncate">{c.name || 'İsimsiz danışan'}</b>
      {c.name.startsWith('Örnek') && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Örnek</span>}
      <span className="ml-auto whitespace-nowrap text-xs text-stone-500">{rr?.target ? `${fmt(rr.target)} kcal` : ''}{nc ? ` · ${nc} durum` : ''}</span>
    </button>
  )
}