import { load, save } from './storage'

/**
 * Eğitim sürümü hesapları: şifre PBKDF2-SHA256 ile özetlenip yalnızca bu tarayıcıda saklanır.
 * Sunucu olmadığı için bu gerçek bir güvenlik katmanı değildir; veriyi koruyan şey tarayıcının kendisidir.
 */
export type AccountKind = 'diyetisyen' | 'danisan'
export interface Account {
  u: string
  salt: string
  hash: string
  ad: string
  kind: AccountKind
  /** Danışan hesabının bağlı olduğu danışan kaydı */
  clientId?: string
  created: number
  /** Diyetisyen başvurusu: onaylanana kadar giriş yapılamaz (boşsa hesap etkin) */
  status?: 'pending' | 'rejected'
  /** Yönetimin onayda verdiği unvan (Dyt., Uzm. Dyt. ...) */
  unvan?: string
}
/** Diyetisyen olmak isteyenlerin başvurusu; yönetici panelinde incelenir */
export interface Application {
  id: string
  /** Başvuran için açılan hesabın kullanıcı adı */
  u?: string
  name: string
  title: string
  note: string
  status: 'pending' | 'approved' | 'rejected'
  /** Onaylanırken verilen unvan */
  unvan?: string
  ts: number
}
export interface Session {
  u: string
  label: string
  kind: 'admin' | 'diyetisyen' | 'danisan'
  clientId?: string
}

export const DEMO = {
  dyt: ['diyetisyen', 'Diyet2026!'],
  dan: ['danisan', 'Danisan2026!'],
  adm: ['admin', 'Yonetim-Kx7#2026'],
} as const
export const DEMO_CLIENT_ID = 'demo-danisan'

const ACC_KEY = 'dm.accounts'
const SESSION_KEY = 'dm.session'
export const APPS_KEY = 'dm.applications'

export async function hashPw(pw: string, salt: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
  const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, k, 256)
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

const newSalt = () => crypto.randomUUID().replace(/-/g, '')
/** Unvanlar: onayda yönetim seçer */
export const UNVANLAR = ['Dyt.', 'Uzm. Dyt.', 'Dr. Dyt.', 'Doç. Dr.', 'Prof. Dr.'] as const
export const withTitle = (a: { ad: string; unvan?: string }) => (a.unvan ? `${a.unvan} ${a.ad}` : a.ad)

export const normUser = (u: string) => u.trim().toLowerCase()
export const userError = (u: string) =>
  /^[a-z0-9._-]{3,20}$/.test(u) ? '' : 'Kullanıcı adı 3-20 karakter olmalı; yalnızca harf, rakam, nokta, alt çizgi ve tire.'
export const pwError = (p: string, p2: string) => (p.length < 8 ? 'Şifre en az 8 karakter olmalı.' : p !== p2 ? 'Şifreler aynı değil.' : '')

export const loadAccounts = () => load<Record<string, Account>>(ACC_KEY, {})
const putAccount = (a: Account) => save(ACC_KEY, { ...loadAccounts(), [a.u]: a })

export const loadSession = (): Session | null => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
}
export const saveSession = (s: Session | null) => {
  try { s ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)) : sessionStorage.removeItem(SESSION_KEY) } catch { /* gizli sekme */ }
}

// Art arda hatalı denemeyi sınırla: 5 hatadan sonra 30 sn bekleme
let fails = 0
let lockedUntil = 0
const failed = (error: string) => {
  if (++fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0 }
  return { ok: false as const, error }
}
export const resetLock = () => { fails = 0; lockedUntil = 0 }

type Result = { ok: true; session: Session } | { ok: false; error: string }

/** Kullanıcı adı ve şifreyle giriş: demo hesaplar ve bu tarayıcıda açılmış hesaplar */
export async function authenticate(userRaw: string, pw: string): Promise<Result> {
  const u = normUser(userRaw)
  if (Date.now() < lockedUntil) return { ok: false, error: `Çok fazla hatalı deneme. ${Math.ceil((lockedUntil - Date.now()) / 1000)} sn sonra tekrar deneyin.` }
  if (!u || !pw) return { ok: false, error: 'Kullanıcı adı ve şifre yazın.' }
  fails = Math.min(fails, 4)
  if (u === DEMO.adm[0]) return pw === DEMO.adm[1] ? { ok: true, session: { u, label: 'Yönetici', kind: 'admin' } } : failed('Kullanıcı adı veya şifre hatalı.')
  if (u === DEMO.dyt[0]) return pw === DEMO.dyt[1] ? { ok: true, session: { u, label: 'Dyt. Demo Diyetisyen', kind: 'diyetisyen' } } : failed('Kullanıcı adı veya şifre hatalı.')
  if (u === DEMO.dan[0]) return pw === DEMO.dan[1] ? { ok: true, session: { u, label: 'Demo Danışan', kind: 'danisan', clientId: DEMO_CLIENT_ID } } : failed('Kullanıcı adı veya şifre hatalı.')
  const a = loadAccounts()[u]
  if (!a) return { ok: false, error: 'Bu kullanıcı adıyla kayıtlı hesap yok. “Hesap oluştur” ile yeni hesap açabilirsiniz.' }
  if ((await hashPw(pw, a.salt)) !== a.hash) return failed('Kullanıcı adı veya şifre hatalı.')
  fails = 0
  if (a.kind === 'danisan' && a.clientId && !load<{ id: string }[]>('dm.clients', []).some((c) => c.id === a.clientId)) {
    return { ok: false, error: 'Bu hesap silinmiş. Yeni bir hesap oluşturabilirsiniz.' }
  }
  if (a.status === 'pending') return { ok: false, error: 'Diyetisyen başvurunuz inceleniyor. Yönetici onayladığında bu kullanıcı adı ve şifreyle giriş yapabilirsiniz.' }
  if (a.status === 'rejected') return { ok: false, error: 'Diyetisyen başvurunuz onaylanmadı.' }
  return { ok: true, session: { u, label: withTitle(a), kind: a.kind, clientId: a.clientId } }
}

export async function register(i: { u: string; ad: string; p: string; p2: string; kind: AccountKind; clientId?: string }): Promise<Result> {
  const u = normUser(i.u)
  const ue = userError(u)
  if (ue) return { ok: false, error: ue }
  if (Object.values(DEMO).some((d) => d[0] === u)) return { ok: false, error: 'Bu kullanıcı adı demo hesaba ayrılmış.' }
  const ad = i.ad.trim().replace(/\s+/g, ' ')
  if (ad.length < 3) return { ok: false, error: 'Ad soyad yazın.' }
  const pe = pwError(i.p, i.p2)
  if (pe) return { ok: false, error: pe }
  if (loadAccounts()[u]) return { ok: false, error: 'Bu kullanıcı adı kullanımda. Başka bir kullanıcı adı seçin ya da giriş yapın.' }
  const salt = newSalt()
  const acc: Account = { u, salt, hash: await hashPw(i.p, salt), ad, kind: i.kind, clientId: i.clientId, created: Date.now() }
  putAccount(acc)
  return { ok: true, session: { u, label: ad, kind: acc.kind, clientId: acc.clientId } }
}

/** Şifre yenileme: kullanıcı adı ve hesap açılırken yazılan ad soyad eşleşmeli */
export async function resetPassword(i: { u: string; ad: string; p: string; p2: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = normUser(i.u)
  const a = loadAccounts()[u]
  if (!a) return { ok: false, error: 'Bu kullanıcı adıyla kayıtlı hesap yok.' }
  if (a.ad.toLocaleLowerCase('tr') !== i.ad.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr')) return { ok: false, error: 'Ad soyad hesapla eşleşmiyor.' }
  const pe = pwError(i.p, i.p2)
  if (pe) return { ok: false, error: pe }
  putAccount({ ...a, hash: await hashPw(i.p, a.salt) })
  return { ok: true }
}
/**
 * "Diyetisyen misiniz? Başvurun": başvuran için bekleyen bir diyetisyen hesabı açılır.
 * Yönetici onaylayınca (setApplicationStatus) hesap etkinleşir.
 */
export async function submitApplication(i: { u: string; ad: string; p: string; p2: string; title: string; note: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!i.title.trim()) return { ok: false, error: 'Unvan veya diploma bilginizi yazın.' }
  const r = await register({ u: i.u, ad: i.ad, p: i.p, p2: i.p2, kind: 'diyetisyen' })
  if (!r.ok) return r
  const u = normUser(i.u)
  putAccount({ ...loadAccounts()[u], status: 'pending' })
  const app: Application = { id: crypto.randomUUID(), u, name: r.session.label, title: i.title.trim(), note: i.note.trim(), status: 'pending', ts: Date.now() }
  save(APPS_KEY, [app, ...load<Application[]>(APPS_KEY, [])])
  return { ok: true }
}

/** Başvuru durumunu ve bağlı hesabı birlikte günceller */
export function setApplicationStatus(id: string, status: Application['status'], unvan?: string) {
  const list = load<Application[]>(APPS_KEY, [])
  const app = list.find((a) => a.id === id)
  save(APPS_KEY, list.map((a) => (a.id === id ? { ...a, status, ...(unvan ? { unvan } : {}) } : a)))
  const acc = app?.u ? loadAccounts()[app.u] : undefined
  if (acc) putAccount({ ...acc, status: status === 'approved' ? undefined : status === 'rejected' ? 'rejected' : 'pending', ...(unvan ? { unvan } : {}) })
}

/** Başvuruyu ve (açıldıysa) bekleyen hesabını siler */
export function removeApplication(id: string) {
  const list = load<Application[]>(APPS_KEY, [])
  const app = list.find((a) => a.id === id)
  save(APPS_KEY, list.filter((a) => a.id !== id))
  if (app?.u) {
    const { [app.u]: _gone, ...rest } = loadAccounts()
    void _gone
    save(ACC_KEY, rest)
  }
}

/**
 * Tek seferlik sıfırlama: açılmış tüm hesaplar (ve başvurular, bağlı danışan kayıtları) silinir.
 * Yönetici ve demo hesaplar kodda tanımlı olduğu için etkilenmez. Her tarayıcıda bir kez çalışır.
 */
export function resetAccountsOnce(tag = 'v1') {
  try {
    if (localStorage.getItem('dm.accountsReset') === tag) return
    const ids = new Set(Object.values(loadAccounts()).map((a) => a.clientId).filter(Boolean))
    save(ACC_KEY, {})
    save(APPS_KEY, [])
    save('dm.clients', load<{ id: string }[]>('dm.clients', []).filter((c) => !ids.has(c.id)))
    saveSession(null)
    localStorage.setItem('dm.accountsReset', tag)
  } catch { /* gizli sekme */ }
}

/** Silinen danışan kaydına bağlı hesapları kaldırır: hesap artık giriş yapamaz */
export function removeAccountsOfClient(clientId: string) {
  const rest = Object.fromEntries(Object.entries(loadAccounts()).filter(([, a]) => a.clientId !== clientId))
  save(ACC_KEY, rest)
}

/** Oturumdaki hesabın şifresini değiştirir (mevcut şifre doğrulanır). Demo hesapların şifresi sabittir. */
export async function changePassword(i: { u: string; current: string; p: string; p2: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = loadAccounts()[normUser(i.u)]
  if (!a) return { ok: false, error: 'Demo hesabın şifresi değiştirilemez. Kendi hesabınızı oluşturarak deneyebilirsiniz.' }
  if (!i.current) return { ok: false, error: 'Mevcut şifrenizi yazın.' }
  if ((await hashPw(i.current, a.salt)) !== a.hash) return { ok: false, error: 'Mevcut şifre hatalı.' }
  const pe = pwError(i.p, i.p2)
  if (pe) return { ok: false, error: pe }
  if (i.p === i.current) return { ok: false, error: 'Yeni şifre mevcut şifreden farklı olmalı.' }
  putAccount({ ...a, hash: await hashPw(i.p, a.salt) })
  return { ok: true }
}