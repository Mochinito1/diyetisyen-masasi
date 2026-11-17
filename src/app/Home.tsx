import { Link } from 'react-router-dom'
import { apDay, isBusy, todayStr, type Appointment } from '../lib/appointments'
import { fmtDay, lastVisit } from '../lib/dossier'
import { load } from '../lib/storage'
import { sampleClients } from '../lib/samples'
import { useClients } from '../features/clients/useClients'
import NextAppointment from '../features/portal/NextAppointment'
import { usePortalClient } from '../features/portal/usePortalClient'
import { navFor } from './nav'
import { ROLES, useRole } from './role'

const GREET = {
  admin: 'Yönetici paneli',
  diyetisyen: 'Diyetisyen paneli',
  danisan: 'Danışan portalı',
} as const

const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'

export default function Home() {
  const { role } = useRole()
  const label = ROLES.find((r) => r.id === role)!.label
  return (
    <div>
      <p className="text-sm font-semibold text-brand-500">{label} olarak görüntülüyorsunuz</p>
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{GREET[role]}</h1>
      <p className="mt-2 max-w-prose text-stone-600">Eğitim amaçlı bir araç. Veriler yalnızca bu tarayıcıda saklanır, gerçek danışan verisi girmeyin.</p>
      {role === 'danisan' ? <ClientHome /> : <DietitianHome />}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {navFor(role).map((n) => (
          <Link key={n.to} to={n.to} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-500 md:p-5">
            <div className="font-display text-lg font-bold">{n.label}</div>
            <div className="mt-1 text-sm text-stone-500">{n.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ClientHome() {
  const { client } = usePortalClient()
  return <div className="mt-6">{client ? <NextAppointment clientId={client.id} /> : <p className="text-sm text-stone-500">Test için önce diyetisyen rolünde bir danışan ekleyin.</p>}</div>
}

function DietitianHome() {
  const { clients, upsert } = useClients()
  const aps = load<Appointment[]>('dm.appointments', [])
  const today = todayStr()
  const todayN = aps.filter((a) => apDay(a) === today && isBusy(a)).length
  const pending = aps.filter((a) => a.status === 'pending').length
  const recent = [...clients].sort((a, b) => b.updated - a.updated).slice(0, 5)
  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {([['Danışan', clients.length, '/danisanlar'], ['Bugün randevu', todayN, '/randevu'], ['Onay bekleyen', pending, '/randevu']] as const).map(([l, n, to]) => (
          <Link key={l} to={to} className="rounded-2xl bg-stone-100 p-3 transition hover:bg-brand-50 md:p-4">
            <div className="text-xs font-semibold text-stone-500">{l}</div>
            <div className="font-display text-2xl font-bold tabular-nums md:text-3xl">{n}</div>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Son danışanlar</h2>
          <button className={btn} onClick={() => sampleClients().forEach(upsert)}>Örnek danışan ekle</button>
        </div>
        {recent.length === 0 ? <p className="mt-2 text-stone-500">Henüz danışan yok. Danışanlar sekmesinden ekleyin ya da örnek danışan yükleyin.</p> : recent.map((c) => {
          const lv = lastVisit(c, aps)
          return (
            <Link key={c.id} to="/danisanlar" className="mt-2 flex items-center justify-between gap-3 border-t border-stone-100 pt-2 hover:text-brand-500">
              <b className="min-w-0 truncate">{c.name}</b>
              <span className="whitespace-nowrap text-xs text-stone-500">{lv ? `Son görüşme ${fmtDay(lv)}` : ''}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}