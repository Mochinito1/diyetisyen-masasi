import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import {
  DAY_MS, MAX_DAYS_AHEAD, addMonths, apDay, apTime, canCancel, dtMs, effectiveStatus, fmtRemaining,
  isBusy, isDayAvailable, longDate, slotsFor, sortByDt, todayStr, type Appointment,
} from '../../lib/appointments'
import { load, save } from '../../lib/storage'
import { useAuth } from '../../app/auth'
import type { ApType } from '../../lib/appointments'
import type { Client } from '../clients/types'
import MonthCalendar from './MonthCalendar'
import type { ApApi } from './useAppointments'

const field = 'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'
const KEY = 'dm.asClient'

export default function ClientView({ api, clients }: { api: ApApi; clients: Client[] }) {
  const { session } = useAuth()
  const [asId, setAsId] = useState<string>(() => load<string>(KEY, ''))
  const [tab, setTab] = useState<'up' | 'past'>('up')
  const [fresh, setFresh] = useState('')
  const [month, setMonth] = useState(todayStr().slice(0, 7))
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [hour, setHour] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [type, setType] = useState<ApType>('yuz')
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
  const past = mine.filter((a) => !(isBusy(a) && apDay(a) >= today)).reverse().slice(0, 20)
  const busy = new Set(api.aps.filter(isBusy).map((a) => a.dt))
  const maxMonth = addMonths(today.slice(0, 7), 3)

  const choose = (id: string) => {
    setAsId(id)
    save(KEY, id)
    setDay(null)
    setSlot(null)
    setHour(null)
  }

  const noDyt = !me.dietitian
  const book = () => {
    if (!day || !slot || noDyt) return
    const id = crypto.randomUUID()
    api.add({
      id, clientId: me.id, clientName: me.name, dt: `${day}T${slot}`, type, link: '',
      note: note.trim(), status: 'pending', by: 'danisan', dietitian: me.dietitian, created: Date.now(),
    })
    setDone(`${longDate(day)} ${slot} için randevu talebin iletildi.`)
    setTab('up')
    setFresh(id)
    setDay(null)
    setSlot(null)
    setNote('')
  }

  return (
    <>
      <PageTitle title="Randevu" sub="Randevu oluştur ve randevularını takip et" />
      {session?.kind === 'admin' && (
      <label className="mb-4 block max-w-xs text-xs font-semibold text-stone-500">
        Test: hangi danışan olarak görüntüleniyor?
        <select className={`${field} mt-1 w-full`} value={me.id} onChange={(e) => choose(e.target.value)}>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Sol: randevu oluştur */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5" aria-label="Randevu oluştur">
          <h2 className="font-display text-lg font-bold">Randevu oluştur</h2>
          <p className="mb-3 text-xs text-stone-500">Takvimden bir gün, ardından bir saat seç.</p>
          {noDyt && (
            <div role="alert" className="mb-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-800">
              Randevu oluşturmak için önce diyetisyenini seçmelisin. <b>Ayarlar → Diyetisyenim</b> bölümünden seçebilirsin.
            </div>
          )}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <MonthCalendar
              month={month}
              onMonth={setMonth}
              selected={day}
              onSelect={(d) => { setDay(d); setSlot(null); setHour(null); setDone('') }}
              disabled={(d) => !isDayAvailable(d, api.av, busy)}
              minMonth={today.slice(0, 7)}
              maxMonth={maxMonth}
            />
            {day && isDayAvailable(day, api.av, busy) ? (
              <>
                <div className="mt-4 text-xs font-bold uppercase tracking-wider capitalize text-stone-500">{longDate(day)}</div>
                {(() => {
                  // Dolu saatler listeden silinmez: soluk ve tıklanamaz görünür
                  const all = slotsFor(day, api.av, new Set())
                  const isFree = (s: string) => !busy.has(`${day}T${s}`)
                  const hours = [...new Set(all.map((s) => s.slice(0, 2)))]
                  const inHour = hour ? all.filter((s) => s.startsWith(`${hour}:`)) : []
                  const parts: [string, (h: number) => boolean][] = [['Sabah', (h) => h < 12], ['Öğleden sonra', (h) => h >= 12 && h < 17], ['Akşam', (h) => h >= 17]]
                  const tile = 'rounded-xl border text-center transition disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:opacity-60 disabled:line-through'
                  const on = 'border-brand-500 bg-brand-500 text-white shadow-sm'
                  const off = 'border-stone-200 bg-white hover:border-brand-500 hover:bg-brand-50'
                  return (
                    <>
                      <div className="mt-3 flex items-center gap-2 text-sm font-bold">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-xs text-white">1</span> Saati seç
                      </div>
                      {parts.map(([label, test]) => {
                        const hs = hours.filter((h) => test(+h))
                        if (!hs.length) return null
                        return (
                          <div key={label} className="mt-2.5">
                            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</div>
                            <div className="grid grid-cols-4 gap-2" role="group" aria-label={`Saat, ${label}`}>
                              {hs.map((h) => {
                                const opts = all.filter((s) => s.startsWith(`${h}:`))
                                const freeOpts = opts.filter(isFree)
                                const full = freeOpts.length === 0
                                return (
                                  <button key={h} disabled={full} title={full ? 'Bu saat dolu' : undefined} aria-pressed={hour === h} className={`${tile} py-2 ${hour === h ? on : off}`}
                                    onClick={() => { setHour(h); setSlot(freeOpts.length === 1 ? freeOpts[0] : null) }}>
                                    <span className="block font-display text-lg font-bold leading-tight tabular-nums">{h}<span className="text-xs font-semibold opacity-60">:00</span></span>
                                    <span className={`block text-[11px] font-semibold ${hour === h ? 'text-white/80' : 'text-stone-500'}`}>{full ? 'dolu' : `${freeOpts.length} boş`}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      {hour && (
                        <>
                          <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-xs text-white">2</span> Dakikayı seç
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Dakika">
                            {inHour.map((s) => (
                              <button key={s} disabled={!isFree(s)} title={isFree(s) ? undefined : 'Bu saat dolu'} aria-pressed={slot === s} className={`${tile} py-2.5 font-display text-base font-bold tabular-nums ${slot === s ? on : off}`} onClick={() => setSlot(s)}>{s}</button>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}                <div className="mt-4 flex items-center gap-2 text-sm font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-xs text-white">3</span> Görüşme şeklini seç</div>
                <div className="mt-1.5 grid grid-cols-2 gap-2" role="group" aria-label="Görüşme şekli">
                  {([['yuz', 'Yüz yüze', 'Klinikte'], ['online', 'Uzaktan', 'Online görüşme']] as const).map(([t, label, sub]) => (
                    <button key={t} aria-pressed={type === t} onClick={() => setType(t)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${type === t ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-stone-300 bg-white hover:border-brand-500'}`}>
                      <span className="block text-sm font-bold">{label}</span>
                      <span className="block text-xs text-stone-500">{sub}</span>
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-xs font-semibold">Not (isteğe bağlı)
                  <input className={`${field} mt-1 w-full`} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
              </>
            ) : (
              <p className="mt-3 text-xs text-stone-500">Takvimden bir gün seçin; o güne ait saatler burada görünür. Yalnızca önümüzdeki {MAX_DAYS_AHEAD} gün ve diyetisyenin açtığı günler seçilebilir.</p>
            )}
          </div>
          <button className="mt-3 w-full rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-white disabled:opacity-40" disabled={!day || !slot || noDyt} onClick={book}>
            {day && slot ? `${longDate(day)} ${slot} · ${type === 'online' ? 'Uzaktan' : 'Yüz yüze'} randevu oluştur` : 'Randevu oluştur'}
          </button>
        </section>

        {/* Sağ: Randevularım */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5" aria-label="Randevularım">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Randevularım</h2>
            <div className="flex overflow-hidden rounded-full border border-stone-300 text-sm font-semibold" role="tablist">
              {([['up', `Yaklaşan (${upcoming.length})`], ['past', `Geçmiş (${past.length})`]] as const).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-1.5 ${tab === k ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}>{label}</button>
              ))}
            </div>
          </div>

          {done && <div role="status" className="mt-3 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-800">{done}</div>}

          <div className="mt-3 space-y-3">
            {tab === 'up' ? (
              upcoming.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
                  <div className="font-semibold text-stone-700">Planlı randevun yok</div>
                  <div className="mt-1 text-sm">Soldaki takvimden yeni bir randevu oluşturabilirsin.</div>
                </div>
              ) : upcoming.map((a) => <MyRow key={a.id} a={a} now={now} fresh={a.id === fresh} onCancel={() => api.patch(a.id, { status: 'cancel' })} />)
            ) : past.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">Geçmiş randevun yok.</div>
            ) : past.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                <DateBadge day={apDay(a)} muted />
                <div className="min-w-0 flex-1">
                  <b className="capitalize">{longDate(apDay(a))}</b>
                  <div className="text-sm text-stone-500">Saat {apTime(a)} · {a.type === 'online' ? 'Uzaktan' : 'Yüz yüze'}</div>
                </div>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${a.status === 'done' ? 'bg-emerald-100 text-emerald-800' : a.status === 'miss' ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-600'}`}>
                  {{ done: 'Geldi', miss: 'Gelmedi', cancel: 'İptal', plan: 'Planlandı', pending: 'Onay bekliyor' }[a.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

/** Gün numarası ve ay kısaltması olan küçük tarih rozeti */
function DateBadge({ day, muted }: { day: string; muted?: boolean }) {
  const d = new Date(`${day}T12:00`)
  return (
    <div className={`grid h-14 w-14 flex-none place-items-center rounded-xl text-center leading-tight ${muted ? 'bg-stone-100 text-stone-600' : 'bg-brand-50 text-brand-500'}`} aria-hidden="true">
      <div>
        <div className="font-display text-xl font-bold">{d.getDate()}</div>
        <div className="text-[11px] font-semibold uppercase">{d.toLocaleDateString('tr-TR', { month: 'short' })}</div>
      </div>
    </div>
  )
}

function MyRow({ a, now, fresh, onCancel }: { a: Appointment; now: number; fresh: boolean; onCancel: () => void }) {
  const st = effectiveStatus(a, now)
  const left = dtMs(a.dt) - DAY_MS - now
  const can = canCancel(a, now)
  return (
    <div className={`rounded-xl border p-3 ${fresh ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <DateBadge day={apDay(a)} />
        <div className="min-w-0 flex-1">
          <b className="capitalize">{longDate(apDay(a))}</b>
          <div className="text-sm text-stone-500">Saat {apTime(a)} · {a.type === 'online' ? 'Uzaktan' : 'Yüz yüze'}{a.note ? ` · ${a.note}` : ''}</div>
        </div>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${st === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {st === 'pending' ? 'Onay bekleniyor' : 'Onaylandı'}
        </span>
        {can && <button className={btn} onClick={onCancel}>İptal et</button>}
      </div>
      <div className="mt-2 text-xs font-semibold text-amber-800">
        {can
          ? <>İptal edebilmek için kalan süre: {fmtRemaining(left)}{st === 'pending' && ' · Diyetisyen onaylamazsa randevuya 24 saat kala otomatik onaylanır.'}</>
          : 'Randevuya 24 saatten az kaldı; randevu otomatik onaylandı ve iptal edilemez.'}
      </div>
    </div>
  )
}