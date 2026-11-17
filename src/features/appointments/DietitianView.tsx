import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import {
  apDay, apTime, dateStr, effectiveStatus, isBusy, longDate, sortByDt, todayStr,
  type ApStatus, type ApType, type Appointment,
} from '../../lib/appointments'
import type { Client } from '../clients/types'
import MonthCalendar from './MonthCalendar'
import type { ApApi } from './useAppointments'

const field = 'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'
const ST: Record<ApStatus, [string, string]> = {
  pending: ['Onay bekliyor', 'bg-amber-100 text-amber-800'],
  plan: ['Planlandı', 'bg-stone-100 text-stone-700'],
  done: ['Geldi', 'bg-emerald-100 text-emerald-800'],
  miss: ['Gelmedi', 'bg-red-100 text-red-800'],
  cancel: ['İptal', 'bg-amber-100 text-amber-800'],
}
const DAYS = [['Pzt', 1], ['Sal', 2], ['Çar', 3], ['Per', 4], ['Cum', 5], ['Cmt', 6], ['Paz', 0]] as const

export default function DietitianView({ api, clients }: { api: ApApi; clients: Client[] }) {
  const { aps } = api
  const [month, setMonth] = useState(todayStr().slice(0, 7))
  const [day, setDay] = useState<string>(todayStr())
  const [adding, setAdding] = useState(false)

  const now = Date.now()
  const today = todayStr()
  const active = aps.filter((a) => a.status !== 'cancel')
  const countOn = (ds: string) => active.filter((a) => apDay(a) === ds && isBusy(a)).length
  const todayN = aps.filter((a) => apDay(a) === today && isBusy(a)).length
  const pending = sortByDt(aps.filter((a) => a.status === 'pending' && effectiveStatus(a, now) === 'pending'))
  const dayList = sortByDt(aps.filter((a) => apDay(a) === day))
  const end = new Date()
  end.setDate(end.getDate() + 14)
  const upcoming = sortByDt(aps.filter((a) => isBusy(a) && apDay(a) >= today && apDay(a) <= dateStr(end)))

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="Randevu" sub={todayN ? `Bugün ${todayN} randevu var` : 'Bugün randevu yok'} />
        <button className="mb-6 rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" onClick={() => setAdding(true)}>Randevu ekle</button>
      </div>

      <div className="space-y-4">
        {adding && <AddForm clients={clients} day={day} onSave={(a) => { api.add(a); setDay(apDay(a)); setMonth(apDay(a).slice(0, 7)); setAdding(false) }} onClose={() => setAdding(false)} />}

        {pending.length > 0 && (
          <div className="rounded-2xl border border-amber-700 bg-white p-5">
            <h2 className="font-display text-lg font-bold">Onay bekleyen randevu talepleri ({pending.length})</h2>
            <p className="text-xs text-stone-500">Danışanların oluşturduğu talepler. Randevuya 24 saat kala onaylanmamış olanlar kendiliğinden onaylanır.</p>
            {pending.map((a) => (
              <Row key={a.id} a={a} showName onChange={api.patch} onRemove={api.remove}
                actions={<>
                  <button className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white" onClick={() => api.patch(a.id, { status: 'plan' })}>Onayla</button>
                  <button className={btn} onClick={() => api.patch(a.id, { status: 'cancel' })}>Reddet</button>
                </>} />
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[360px_1fr]">
          <div className="h-fit rounded-2xl border border-stone-200 bg-white p-4">
            <MonthCalendar month={month} onMonth={setMonth} selected={day} onSelect={setDay} count={countOn} />
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold capitalize">{longDate(day)}</h2>
            {dayList.length === 0 ? <p className="mt-2 text-stone-500">Bu gün için randevu yok.</p> : dayList.map((a) => <Row key={a.id} a={a} showName onChange={api.patch} onRemove={api.remove} />)}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-lg font-bold">Önümüzdeki 14 gün</h2>
          {upcoming.length === 0 ? <p className="mt-2 text-stone-500">Yaklaşan randevu yok.</p> : upcoming.map((a) => (
            <div key={a.id} className="mt-2 border-t border-stone-100 pt-2">
              <div className="text-xs capitalize text-stone-500">{longDate(apDay(a))}</div>
              <Row a={a} showName onChange={api.patch} onRemove={api.remove} />
            </div>
          ))}
        </div>

        <Hours api={api} />
      </div>
    </>
  )
}

function Row({ a, showName, onChange, onRemove, actions }: {
  a: Appointment
  showName?: boolean
  onChange: ApApi['patch']
  onRemove: ApApi['remove']
  actions?: React.ReactNode
}) {
  const st = effectiveStatus(a)
  const [label, tone] = ST[st]
  return (
    <div className="grid grid-cols-[56px_1fr] gap-x-3 gap-y-2 border-t border-stone-100 py-3 first:border-t-0">
      <b className="font-display text-lg tabular-nums">{apTime(a)}</b>
      <div>
        <b>{showName ? a.clientName : a.type === 'online' ? 'Online görüşme' : 'Yüz yüze'}</b>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className={`rounded-full px-2 py-0.5 ${tone}`}>{label}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5">{a.type === 'online' ? 'Online' : 'Yüz yüze'}</span>
          {a.by === 'danisan' && <span className="rounded-full bg-stone-100 px-2 py-0.5">Danışan oluşturdu</span>}
        </div>
        {a.type === 'online' && a.link && <a className="mt-1 block break-all text-sm text-brand-500 underline" href={a.link} target="_blank" rel="noopener noreferrer">{a.link}</a>}
        {a.note && <div className="mt-1 text-sm text-stone-500">{a.note}</div>}
      </div>
      <div className="col-span-2 flex flex-wrap gap-2">
        {actions ?? (
          <>
            {st === 'plan' || st === 'pending' ? (
              <>
                <button className={btn} onClick={() => onChange(a.id, { status: 'done' })}>Geldi</button>
                <button className={btn} onClick={() => onChange(a.id, { status: 'miss' })}>Gelmedi</button>
                <button className={btn} onClick={() => onChange(a.id, { status: 'cancel' })}>İptal</button>
              </>
            ) : (
              <button className={btn} onClick={() => onChange(a.id, { status: 'plan' })}>Geri al</button>
            )}
            <button className={btn} onClick={() => confirm('Randevu silinsin mi?') && onRemove(a.id)}>Sil</button>
          </>
        )}
      </div>
    </div>
  )
}

function AddForm({ clients, day, onSave, onClose }: { clients: Client[]; day: string; onSave: (a: Appointment) => void; onClose: () => void }) {
  const [cid, setCid] = useState(clients[0]?.id ?? '')
  const [date, setDate] = useState(day < todayStr() ? todayStr() : day)
  const [time, setTime] = useState('10:00')
  const [type, setType] = useState<ApType>('yuz')
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const client = clients.find((c) => c.id === cid)

  return (
    <div className="rounded-2xl border border-brand-500 bg-white p-5">
      <h2 className="font-display text-lg font-bold">Randevu ekle</h2>
      {clients.length === 0 ? (
        <p className="mt-2 text-stone-500">Önce Danışanlar sekmesinden bir danışan ekleyin.</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold sm:col-span-2">Danışan
            <select className={`${field} mt-1 w-full`} value={cid} onChange={(e) => setCid(e.target.value)}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Tarih
            <input type="date" className={`${field} mt-1 w-full`} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">Saat
            <input type="time" className={`${field} mt-1 w-full`} value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <div className="text-sm font-semibold sm:col-span-2">Tür
            <div className="mt-1 flex overflow-hidden rounded-lg border border-stone-300 sm:w-72">
              {(['yuz', 'online'] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 ${type === t ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}>{t === 'yuz' ? 'Yüz yüze' : 'Online'}</button>
              ))}
            </div>
          </div>
          {type === 'online' && (
            <label className="block text-sm font-semibold sm:col-span-2">Görüşme linki
              <input className={`${field} mt-1 w-full`} placeholder="https://meet.google.com/..." value={link} onChange={(e) => setLink(e.target.value)} />
            </label>
          )}
          <label className="block text-sm font-semibold sm:col-span-2">Not
            <input className={`${field} mt-1 w-full`} placeholder="İsteğe bağlı" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40"
          disabled={!client || !date || !time}
          onClick={() => client && onSave({
            id: crypto.randomUUID(), clientId: client.id, clientName: client.name, dt: `${date}T${time}`,
            type, link: type === 'online' ? link.trim() : '', note: note.trim(), status: 'plan', by: 'diyetisyen', created: Date.now(),
          })}
        >
          Kaydet
        </button>
        <button className={btn} onClick={onClose}>Vazgeç</button>
      </div>
    </div>
  )
}

function Hours({ api }: { api: ApApi }) {
  const { av, setAv } = api
  const toggle = (d: number) => setAv({ ...av, days: av.days.includes(d) ? av.days.filter((x) => x !== d) : [...av.days, d] })
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold">Çalışma saatleri</h2>
      <p className="text-xs text-stone-500">Danışanlar yalnızca burada açtığınız gün ve saatlere randevu alabilir.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {DAYS.map(([label, d]) => (
          <button key={d} aria-pressed={av.days.includes(d)} onClick={() => toggle(d)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${av.days.includes(d) ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-600'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="text-xs font-semibold">Başlangıç<input type="time" className={`${field} mt-1 block`} value={av.start} onChange={(e) => setAv({ ...av, start: e.target.value })} /></label>
        <label className="text-xs font-semibold">Bitiş<input type="time" className={`${field} mt-1 block`} value={av.end} onChange={(e) => setAv({ ...av, end: e.target.value })} /></label>
        <label className="text-xs font-semibold">Süre
          <select className={`${field} mt-1 block`} value={av.step} onChange={(e) => setAv({ ...av, step: +e.target.value })}>
            {[20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} dk</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
