import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import {
  DAY_MS, MAX_DAYS_AHEAD, addMonths, apDay, apTime, canCancel, dtMs, effectiveStatus, fmtRemaining,
  isBusy, isDayAvailable, longDate, slotRange, slotsFor, sortByDt, todayStr, type Appointment,
} from '../../lib/appointments'
import { load, save } from '../../lib/storage'
import { useAuth } from '../../app/auth'
import type { Client } from '../clients/types'
import MonthCalendar from './MonthCalendar'
import type { ApApi } from './useAppointments'

const field = 'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'
const KEY = 'dm.asClient'

export default function ClientView({ api, clients }: { api: ApApi; clients: Client[] }) {
  const { session } = useAuth()
  const [asId, setAsId] = useState<string>(() => load<string>(KEY, ''))
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(todayStr().slice(0, 7))
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [done, setDone] = useState('')

  if (clients.length === 0)
    return (
      <>
        <PageTitle title="Randevu" sub="Randevularını buradan oluşturabilirsin" />
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          Test için önce diyetisyen rolünde bir danışan ekleyin.
        </div>
      </>
    )

  const me = clients.find((c) => c.id === asId) ?? clients[0]
  const now = Date.now()
  const today = todayStr()
  const mine = sortByDt(api.aps.filter((a) => a.clientId === me.id))
  const upcoming = mine.filter((a) => isBusy(a) && apDay(a) >= today)
  const past = mine.filter((a) => !(isBusy(a) && apDay(a) >= today)).reverse().slice(0, 8)
  const busy = new Set(api.aps.filter(isBusy).map((a) => a.dt))
  const maxMonth = addMonths(today.slice(0, 7), 3)

  const choose = (id: string) => {
    setAsId(id)
    save(KEY, id)
    setOpen(false)
    setDay(null)
    setSlot(null)
  }

  const book = () => {
    if (!day || !slot) return
    api.add({
      id: crypto.randomUUID(), clientId: me.id, clientName: me.name, dt: `${day}T${slot}`, type: 'yuz', link: '',
      note: note.trim(), status: 'pending', by: 'danisan', created: Date.now(),
    })
    setDone(`${longDate(day)} ${slot} için randevu talebin iletildi.`)
    setOpen(false)
    setDay(null)
    setSlot(null)
    setNote('')
  }

  return (
    <>
      <PageTitle title="Randevu" sub="Randevularını buradan oluşturabilirsin" />
      {session?.kind === 'admin' && (
      <label className="mb-4 block max-w-xs text-xs font-semibold text-stone-500">
        Test: hangi danışan olarak görüntüleniyor?
        <select className={`${field} mt-1 w-full`} value={me.id} onChange={(e) => choose(e.target.value)}>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      )}

      <div className="space-y-4">
        {done && <div className="rounded-xl bg-emerald-100 p-3 text-sm text-emerald-800">{done}</div>}

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Randevularım</h2>
            <button className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" aria-expanded={open} onClick={() => { setOpen(!open); setDone('') }}>
              Randevu oluştur
            </button>
          </div>

          {open && (
            <div className="mt-4 max-w-md rounded-xl border border-stone-200 bg-stone-50 p-4">
              <MonthCalendar
                month={month}
                onMonth={setMonth}
                selected={day}
                onSelect={(d) => { setDay(d); setSlot(null) }}
                disabled={(d) => !isDayAvailable(d, api.av, busy)}
                minMonth={today.slice(0, 7)}
                maxMonth={maxMonth}
              />
              {day && isDayAvailable(day, api.av, busy) ? (
                <>
                  <div className="mt-4 text-xs font-bold uppercase tracking-wider capitalize text-stone-500">{longDate(day)} · saat aralıkları</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slotsFor(day, api.av, busy).map((s) => (
                      <button key={s} onClick={() => setSlot(s)} className={`rounded-full border px-3 py-1 text-sm font-semibold ${slot === s ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white'}`}>{slotRange(s, api.av.step)}</button>
                    ))}
                  </div>
                  <label className="mt-3 block text-xs font-semibold">Not (isteğe bağlı)
                    <input className={`${field} mt-1 w-full`} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
                  </label>
                  <button className="mt-3 rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white disabled:opacity-40" disabled={!slot} onClick={book}>Randevu oluştur</button>
                </>
              ) : (
                <p className="mt-3 text-xs text-stone-500">Takvimden bir gün seçin; o güne ait saat aralıkları burada görünür. Yalnızca önümüzdeki {MAX_DAYS_AHEAD} gün ve diyetisyenin açtığı günler seçilebilir.</p>
              )}
            </div>
          )}

          {upcoming.length === 0 ? (
            <p className="mt-3 text-stone-500">Planlı randevun yok.</p>
          ) : upcoming.map((a) => <MyRow key={a.id} a={a} now={now} onCancel={() => api.patch(a.id, { status: 'cancel' })} />)}
        </div>

        {past.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="font-display text-lg font-bold">Geçmiş</h3>
            {past.map((a) => (
              <div key={a.id} className="flex justify-between border-t border-stone-100 py-2 text-sm first:border-t-0">
                <span className="capitalize">{longDate(apDay(a))} {apTime(a)}</span>
                <span className="font-semibold">{{ done: 'Geldi', miss: 'Gelmedi', cancel: 'İptal', plan: 'Planlandı', pending: 'Onay bekliyor' }[a.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function MyRow({ a, now, onCancel }: { a: Appointment; now: number; onCancel: () => void }) {
  const st = effectiveStatus(a, now)
  const left = dtMs(a.dt) - DAY_MS - now
  const can = canCancel(a, now)
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
      <div>
        <b className="capitalize">{longDate(apDay(a))}</b>
        <div className="text-sm text-stone-500">Saat {apTime(a)}{a.note ? ` · ${a.note}` : ''}</div>
        {can ? (
          <div className="mt-1 text-xs font-semibold text-amber-800">
            İptal edebilmek için kalan süre: {fmtRemaining(left)}
            {st === 'pending' && ' · Diyetisyen onaylamazsa randevuya 24 saat kala otomatik onaylanır.'}
          </div>
        ) : (
          <div className="mt-1 text-xs font-semibold text-amber-800">Randevuya 24 saatten az kaldı; randevu otomatik onaylandı ve iptal edilemez.</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${st === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {st === 'pending' ? 'Diyetisyen onayı bekleniyor' : 'Onaylandı'}
        </span>
        {can && <button className={btn} onClick={onCancel}>İptal et</button>}
      </div>
    </div>
  )
}
