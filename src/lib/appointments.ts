export type ApStatus = 'pending' | 'plan' | 'done' | 'miss' | 'cancel'
export type ApType = 'yuz' | 'online'

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  /** Yerel saat: YYYY-MM-DDTHH:MM */
  dt: string
  type: ApType
  link: string
  note: string
  status: ApStatus
  /** Randevuyu kim oluşturdu */
  by: 'diyetisyen' | 'danisan'
  /** Randevunun ait olduğu diyetisyen (boşsa demo diyetisyen) */
  dietitian?: string
  created: number
}

/** Diyetisyenin randevuya açtığı gün ve saatler */
export interface Availability {
  /** 0 = Pazar … 6 = Cumartesi */
  days: number[]
  start: string
  end: string
  step: number
}

export const DEFAULT_AVAILABILITY: Availability = { days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00', step: 30 }

export const DAY_MS = 24 * 60 * 60 * 1000
/** Danışan en fazla bu kadar gün sonrasına randevu alabilir */
export const MAX_DAYS_AHEAD = 90

const pad = (n: number) => String(n).padStart(2, '0')
export const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = (now = new Date()) => dateStr(now)
export const dtMs = (dt: string) => new Date(dt).getTime()
export const apDay = (a: Pick<Appointment, 'dt'>) => a.dt.slice(0, 10)
export const apTime = (a: Pick<Appointment, 'dt'>) => a.dt.slice(11, 16)

export const longDate = (ds: string) =>
  new Date(`${ds}T12:00:00`).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
export const monthTitle = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** Ayın hücreleri: baştaki boşluklar (Pazartesi başlangıçlı) ve gün sayısı */
export function monthGrid(ym: string): { lead: number; days: number } {
  const [y, m] = ym.split('-').map(Number)
  return { lead: (new Date(y, m - 1, 1).getDay() + 6) % 7, days: new Date(y, m, 0).getDate() }
}

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}
const fromMin = (t: number) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`

/** Randevu hâlâ bir saati dolduruyor mu? */
export const isBusy = (a: Appointment) => a.status === 'pending' || a.status === 'plan'

/** Bir günde alınabilir saat başlangıçları: dolu saatler ve geçmiş saatler çıkarılır. */
export function slotsFor(day: string, av: Availability, busy: Set<string>, now = new Date()): string[] {
  if (!av.days.includes(new Date(`${day}T12:00:00`).getDay())) return []
  const out: string[] = []
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isToday = day === todayStr(now)
  for (let t = toMin(av.start); t + av.step <= toMin(av.end); t += av.step) {
    const tt = fromMin(t)
    if (busy.has(`${day}T${tt}`)) continue
    if (isToday && t <= nowMin) continue
    out.push(tt)
  }
  return out
}

export function isDayAvailable(day: string, av: Availability, busy: Set<string>, now = new Date()): boolean {
  if (day < todayStr(now)) return false
  const max = new Date(now)
  max.setDate(max.getDate() + MAX_DAYS_AHEAD)
  if (day > dateStr(max)) return false
  return slotsFor(day, av, busy, now).length > 0
}

export const slotRange = (start: string, step: number) => `${start} – ${fromMin(toMin(start) + step)}`

/** Randevuya 24 saatten fazla var mı? (iptal edilebilir) */
export const canCancel = (a: Pick<Appointment, 'dt'>, now = Date.now()) => dtMs(a.dt) - now > DAY_MS

/**
 * Danışanın oluşturduğu "onay bekliyor" randevu, randevuya 24 saat kala kendiliğinden onaylanır.
 * Görüntülenen durum bu kurala göre hesaplanır.
 */
export function effectiveStatus(a: Appointment, now = Date.now()): ApStatus {
  if (a.status === 'pending' && dtMs(a.dt) - now <= DAY_MS) return 'plan'
  return a.status
}

export function fmtRemaining(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const mm = m % 60
  return [d ? `${d} gün` : '', h ? `${h} saat` : '', !d && mm ? `${mm} dk` : ''].filter(Boolean).join(' ') || '1 dk'
}

export const sortByDt = (list: Appointment[]) => [...list].sort((a, b) => (a.dt < b.dt ? -1 : a.dt > b.dt ? 1 : 0))