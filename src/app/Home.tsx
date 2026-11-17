import { useNavigate } from 'react-router-dom'
import { apDay, isBusy, todayStr, type Appointment } from '../lib/appointments'
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
import NavIcon from './NavIcon'
import { navFor } from './nav'
import { useRole } from './role'

const TONE = { ok: 'bg-emerald-100 text-emerald-800', warn: 'bg-amber-100 text-amber-800', bad: 'bg-red-100 text-red-800' } as const
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'
const primary = 'rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110'

export default function Home() {
  const { role } = useRole()
  return (
    <div>
      <div className="py-4 text-center">
        <h1 className="font-display text-[26px] font-bold leading-tight md:text-[32px]">Diyetisyen Masası</h1>
        <p className="mt-2 text-sm text-stone-500">Eğitim amaçlı: veriler yalnızca bu tarayıcıda saklanır, gerçek danışan verisi girmeyin.</p>
      </div>
      {role === 'danisan' ? <ClientHome /> : <DietitianHome />}
    </div>
  )
}

function Tile({ icon, title, sub, onClick }: { icon: Parameters<typeof NavIcon>[0]['name']; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-h-[158px] flex-col items-start gap-1 rounded-[16px] border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-500">
      <span className="mb-auto grid h-12 w-12 place-items-center rounded-[14px] bg-brand-50 text-brand-500"><NavIcon name={icon} className="h-[26px] w-[26px]" /></span>
      <b className="mt-3 font-display text-[17px]">{title}</b>
      <span className="text-[12.5px] text-stone-500">{sub}</span>
    </button>
  )
}

function ClientHome() {
  const { client } = usePortalClient()
  const nav = useNavigate()
  const tiles = navFor('danisan')
  return (
    <>
      {client ? <NextAppointment clientId={client.id} /> : <p className="mb-4 text-sm text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</p>}
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((n) => <Tile key={n.to} icon={n.icon} title={n.label} sub={n.desc} onClick={() => nav(n.to)} />)}
      </div>
    </>
  )
}

function DietitianHome() {
  const { role } = useRole()
  const nav = useNavigate()
  const { clients, upsert } = useClients()
  const { client } = useSelectedClient(clients)
  const { brand } = useBrand()
  const food = useFoodData()
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)
  const aps = load<Appointment[]>('dm.appointments', [])
  const today = todayStr()
  const todayN = aps.filter((a) => apDay(a) === today && isBusy(a)).length
  const r = client ? calculate(toCalcInput(client.profile)) : null
  const okCount = evalr ? [...evalr.map.values()].filter((e) => e.st === 'ok').length : null
  const open = (id: string) => { save('dm.menuClient', id); save('dm.openClient', id); nav('/danisanlar') }
  const recent = [...clients].sort((a, b) => b.updated - a.updated).slice(0, 4)

  const sub = {
    danisan: clients.length ? `${clients.length} kayıtlı danışan` : 'Danışan ekle',
    hesap: r?.target ? `${fmt(r.target)} kcal · BKİ ${fmt(r.bmi, 1)}` : client ? 'Bilgi eksik' : 'Danışan seçin',
    besinler: okCount != null && client ? `${okCount} uygun besin` : food ? `${food.foods.length} besin` : 'TürKomp listesi',
    menu: client ? `${client.menu.length} ürün` : 'Danışan seçin',
    randevu: todayN ? `Bugün ${todayN} randevu` : 'Bugün randevu yok',
    ayarlar: brand.clinic || 'Logo, PDF ve mesaj ayarları',
    yonetim: 'Hesaplar ve başvurular',
  }
  const subOf = (to: string) => (({ '/danisanlar': sub.danisan, '/hesaplama': sub.hesap, '/besinler': sub.besinler, '/menu': sub.menu, '/randevu': sub.randevu, '/ayarlar': sub.ayarlar, '/yonetim': sub.yonetim }) as Record<string, string>)[to] ?? ''

  return (
    <>
      {client ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <button className="min-w-0 flex-1 basis-56 text-left" onClick={() => open(client.id)} title="Danışan bilgilerini aç">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">Aktif danışan</div>
            <h2 className="mt-0.5 font-display text-lg font-bold hover:text-brand-500">{client.name || 'İsimsiz danışan'}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
              {r?.adult && r.category && <span className={`rounded-full px-2.5 py-0.5 ${TONE[r.tone!]}`}>BKİ {fmt(r.bmi, 1)} · {r.category}</span>}
              {r?.target && <span className={`rounded-full px-2.5 py-0.5 ${TONE.ok}`}>{fmt(r.target)} kcal/gün</span>}
              {evalr?.conds.map((c) => <span key={c.id} className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5">{c.short}</span>)}
            </div>
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className={primary} onClick={() => open(client.id)}>Danışanı aç</button>
            <button className={btn} onClick={() => nav('/danisanlar')}>Danışan değiştir</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">Aktif danışan</div>
            <h2 className="mt-0.5 font-display text-lg font-bold">Seçili danışan yok</h2>
            <p className="mt-1 text-stone-500">Başlamak için bir danışan açın veya yeni danışan kaydedin.</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className={primary} onClick={() => { save('dm.openClient', 'new'); nav('/danisanlar') }}>Yeni danışan</button>
            <button className={btn} onClick={() => nav('/danisanlar')}>Danışanlar</button>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {navFor(role).map((n) => <Tile key={n.to} icon={n.icon} title={n.label} sub={subOf(n.to)} onClick={() => nav(n.to)} />)}
      </div>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-lg font-bold">Son danışanlar</h2>
          <button className={`${btn} ml-auto`} onClick={() => nav('/danisanlar')}>Tümü</button>
          <button className={btn} onClick={() => sampleClients().forEach(upsert)}>Örnek danışan ekle</button>
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