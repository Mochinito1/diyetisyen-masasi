import { Link } from 'react-router-dom'
import { apDay, apTime, effectiveStatus, isBusy, longDate, sortByDt, todayStr, type Appointment } from '../../lib/appointments'
import { load } from '../../lib/storage'

/** "Sonraki randevunuz" hatırlatma şeridi */
export default function NextAppointment({ clientId }: { clientId: string }) {
  const aps = load<Appointment[]>('dm.appointments', [])
  const next = sortByDt(aps.filter((a) => a.clientId === clientId && isBusy(a) && apDay(a) >= todayStr()))[0]
  if (!next) return null
  const st = effectiveStatus(next)
  return (
    <Link to="/randevu" className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-600">
      <b>Sonraki randevunuz:</b> <span className="capitalize">{longDate(apDay(next))}</span> · {apTime(next)}
      <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold">{st === 'pending' ? 'Onay bekleniyor' : 'Onaylandı'}</span>
    </Link>
  )
}