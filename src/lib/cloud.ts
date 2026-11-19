import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Account, AccountKind, Application, Session } from './auth'
import { cleanName, normUser, pwError, userError, withTitle } from './authRules'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseConfig'
import { load, setSaveListener } from './storage'

/**
 * Supabase katmanı: giriş/hesaplar ve verilerin sunucuyla eşitlenmesi.
 * Uygulamanın geri kalanı yine localStorage'daki "dm." anahtarlarını okur/yazar; bu katman
 *  - girişte sunucudaki (RLS ile süzülmüş) veriyi bu anahtarlara indirir (pull),
 *  - kaydedilen danışan/randevu/klinik ayarlarını sunucuya gönderir (push).
 * Boş yapılandırmada (supabaseConfig.ts) etkin değildir ve uygulama yerel modda çalışır.
 */
// Testler her zaman yerel modda çalışır (gerçek sunucuya istek atmaz)
export const cloudEnabled = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '' && import.meta.env.MODE !== 'test'

const sb: SupabaseClient | null = cloudEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
const db = () => sb as SupabaseClient

type Result = { ok: true; session: Session } | { ok: false; error: string }
const fail = (error: string) => ({ ok: false as const, error })

interface Profile {
  id: string
  username: string
  ad: string
  kind: 'admin' | 'diyetisyen' | 'danisan'
  unvan: string | null
  status: 'pending' | 'rejected' | 'inactive' | null
  client_id: string | null
  created: string
}
interface ClientLike { id: string; dietitian?: string }
interface ApLike { id: string; clientId: string; dietitian?: string }

/** Kullanıcı adından geçerli bir e-posta türetir (Supabase giriş için e-posta ister; gerçek e-posta kullanılmaz) */
const emailOf = (u: string) => `u${[...u].map((c) => c.charCodeAt(0).toString(16)).join('')}@diyetisyen-masasi.app`

// ───────────── Oturum bağlamı ve eşitleme durumu ─────────────
let ctx: { uid: string; username: string; kind: Profile['kind']; clientId?: string } | null = null
const snap = { clients: new Map<string, string>(), aps: new Map<string, string>(), settings: new Map<string, string>() }
const owners = new Map<string, string>()

const CACHE_KEYS = ['dm.clients', 'dm.appointments', 'dm.accounts', 'dm.applications', 'dm.asClient', 'dm.menuClient', 'dm.openClient', 'dm.removedFoods', 'dm.customFoods']
/** Tüm diyetisyenler için ortak besin ayarları: yalnızca yönetici yazar (settings tablosunda owner = '_global') */
const GLOBAL_KEYS = ['dm.removedFoods', 'dm.customFoods']
const setRaw = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* kota */ } }

function clearCache() {
  for (const k of [...Array(localStorage.length)].map((_, i) => localStorage.key(i)!).filter(Boolean)) {
    if (CACHE_KEYS.includes(k) || k.startsWith('dm.brand') || k.startsWith('dm.availability')) localStorage.removeItem(k)
  }
  snap.clients.clear(); snap.aps.clear(); snap.settings.clear(); owners.clear()
}

export function reportError(e: unknown) {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
  console.error('[bulut]', e)
  window.dispatchEvent(new CustomEvent('dm-cloud-error', { detail: msg }))
}

async function ok<T>(q: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const r = await q
  if (r.error) throw new Error(r.error.message)
  return (r.data ?? ([] as unknown)) as T
}

const toAccount = (p: Profile): Account => ({
  u: p.username, salt: '', hash: '', ad: p.ad, kind: p.kind as AccountKind, clientId: p.client_id ?? undefined,
  created: Date.parse(p.created), status: p.status ?? undefined, unvan: p.unvan ?? undefined,
})
const sessionOf = (p: Profile): Session => ({
  u: p.username, label: p.kind === 'admin' ? 'Yönetici' : withTitle({ ad: p.ad, unvan: p.unvan ?? undefined }), kind: p.kind, clientId: p.client_id ?? undefined,
})

// ───────────── Pull: sunucudan yerel önbelleğe ─────────────
async function pullAll(me: Profile) {
  const d = db()
  const profiles = await ok<Profile[]>(d.from('profiles').select('*'))
  const apps = me.kind === 'admin' ? await ok<Record<string, unknown>[]>(d.from('applications').select('*').order('created', { ascending: false })) : []
  const clientRows = await ok<{ id: string; data: ClientLike; owner_user: string | null }[]>(d.from('clients').select('id,data,owner_user'))
  const apRows = await ok<{ id: string; data: ApLike }[]>(d.from('appointments').select('id,data'))
  const settings = await ok<{ owner: string; key: string; value: unknown }[]>(d.from('settings').select('owner,key,value'))

  // Yönetici ilk girişte sunucuda henüz yoksa, bu tarayıcıdaki eklenmiş besinleri korur ve sunucuya yükler
  const localCustom = me.kind === 'admin' ? localStorage.getItem('dm.customFoods') : null
  clearCache()
  const accounts: Record<string, Account> = {}
  for (const p of profiles) if (p.kind !== 'admin') accounts[p.username] = toAccount(p)
  setRaw('dm.accounts', accounts)
  setRaw('dm.applications', apps.map((a) => ({
    id: a.id, u: a.username, name: a.name, title: a.title, note: a.note, status: a.status, unvan: a.unvan ?? undefined, ts: Date.parse(String(a.created)),
  } as Application)))

  const clients = clientRows.map((r) => ({ ...r.data, id: r.id }))
  setRaw('dm.clients', clients)
  for (const r of clientRows) { snap.clients.set(r.id, JSON.stringify({ ...r.data, id: r.id })); if (r.owner_user) owners.set(r.id, r.owner_user) }

  const own = apRows.map((r) => ({ ...r.data, id: r.id }))
  for (const a of own) snap.aps.set(a.id, JSON.stringify(a))
  let all = own as ApLike[]
  // Danışan: seçtiği diyetisyenin dolu saatleri (isimsiz) görünür, böylece çakışma olmaz
  if (me.kind === 'danisan') {
    const chosen = clients.find((c) => c.id === me.client_id)?.dietitian
    if (chosen) {
      // Boş saatler: önce kısıtlı fonksiyon; henüz kurulmadıysa eski görünüm. Hata olursa giriş bozulmasın.
      let slots: { id: string; data: ApLike }[] = []
      try {
        const r = await d.rpc('appointment_slots', { p_dietitian: chosen })
        if (!r.error) slots = (r.data ?? []) as typeof slots
        else slots = await ok<{ id: string; data: ApLike }[]>(d.from('appointment_slots').select('id,data').eq('dietitian', chosen))
      } catch (e) { console.warn('[bulut] dolu saatler alınamadı', e) }
      const have = new Set(own.map((a) => a.id))
      all = [...own, ...slots.filter((s) => !have.has(s.id)).map((s) => ({ ...s.data, id: s.id }))]
    }
  }
  setRaw('dm.appointments', all)

  for (const s of settings) {
    const key = s.owner === '_global' ? `dm.${s.key}` : `dm.${s.key}.${s.owner}`
    setRaw(key, s.value)
    snap.settings.set(key, JSON.stringify(s.value))
  }
  ctx = { uid: me.id, username: me.username, kind: me.kind, clientId: me.client_id ?? undefined }
  if (localCustom && !snap.settings.has('dm.customFoods')) {
    localStorage.setItem('dm.customFoods', localCustom)
    dirty.add('dm.customFoods')
    void cloudFlush()
  }
}

// ───────────── Push: yerel değişiklikleri sunucuya ─────────────
const dirty = new Set<string>()
let timer: ReturnType<typeof setTimeout> | null = null
let chain: Promise<void> = Promise.resolve()

async function pushKey(key: string) {
  if (!ctx) return
  const d = db()
  if (key === 'dm.clients') {
    const list = load<ClientLike[]>('dm.clients', [])
    const cur = new Map(list.map((c) => [c.id, JSON.stringify(c)]))
    for (const c of list) {
      if (snap.clients.get(c.id) === cur.get(c.id)) continue
      const row: Record<string, unknown> = { id: c.id, data: c, dietitian: c.dietitian ?? '', updated: new Date().toISOString() }
      const own = owners.get(c.id) ?? (ctx.kind === 'danisan' && ctx.clientId === c.id ? ctx.uid : undefined)
      if (own) row.owner_user = own
      const { error } = await d.from('clients').upsert(row)
      if (error) throw new Error(`Danışan kaydedilemedi: ${error.message}`)
      snap.clients.set(c.id, cur.get(c.id)!)
      if (own) owners.set(c.id, own)
    }
    const gone = [...snap.clients.keys()].filter((id) => !cur.has(id))
    if (gone.length) {
      const { error } = await d.from('clients').delete().in('id', gone)
      if (error) throw new Error(`Danışan silinemedi: ${error.message}`)
      gone.forEach((id) => { snap.clients.delete(id); owners.delete(id) })
    }
  } else if (key === 'dm.appointments') {
    const list = load<ApLike[]>('dm.appointments', []).filter((a) => a.clientId !== 'hidden')
    const cur = new Map(list.map((a) => [a.id, JSON.stringify(a)]))
    for (const a of list) {
      if (snap.aps.get(a.id) === cur.get(a.id)) continue
      const { error } = await d.from('appointments').upsert({ id: a.id, client_id: a.clientId, dietitian: a.dietitian ?? '', data: a, updated: new Date().toISOString() })
      if (error) throw new Error(`Randevu kaydedilemedi: ${error.message}`)
      snap.aps.set(a.id, cur.get(a.id)!)
    }
    const gone = [...snap.aps.keys()].filter((id) => !cur.has(id))
    if (gone.length) {
      const { error } = await d.from('appointments').delete().in('id', gone)
      if (error) throw new Error(`Randevu silinemedi: ${error.message}`)
      gone.forEach((id) => snap.aps.delete(id))
    }
  } else {
    const g = GLOBAL_KEYS.includes(key) ? /^dm\.(.+)$/.exec(key) : null
    const m = g ?? /^dm\.(brand|availability)\.(.+)$/.exec(key)
    if (!m) return
    if (g && ctx.kind !== 'admin') return
    let v: unknown = null
    try { v = JSON.parse(localStorage.getItem(key) ?? 'null') } catch { /* bozuk */ }
    if (v === null || snap.settings.get(key) === JSON.stringify(v)) return
    const { error } = await d.from('settings').upsert({ owner: g ? '_global' : m[2], key: m[1], value: v, updated: new Date().toISOString() })
    if (error) throw new Error(`Ayarlar kaydedilemedi: ${error.message}`)
    snap.settings.set(key, JSON.stringify(v))
  }
}

/** Bekleyen değişiklikleri hemen sunucuya gönderir */
export function cloudFlush(): Promise<void> {
  if (!cloudEnabled) return Promise.resolve()
  if (timer) { clearTimeout(timer); timer = null }
  const keys = [...dirty]
  dirty.clear()
  chain = chain.then(async () => {
    for (const k of keys) {
      try { await pushKey(k) } catch (e) { reportError(e) }
    }
  })
  return chain
}

if (cloudEnabled) {
  setSaveListener((key) => {
    if (!ctx) return
    if (key !== 'dm.clients' && key !== 'dm.appointments' && !GLOBAL_KEYS.includes(key) && !key.startsWith('dm.brand.') && !key.startsWith('dm.availability.')) return
    dirty.add(key)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => void cloudFlush(), 400)
  })
}

// ───────────── Giriş / hesap ─────────────
async function fetchProfile(uid: string): Promise<Profile | null> {
  const { data, error } = await db().from('profiles').select('*').eq('id', uid).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as Profile | null) ?? null
}

async function openSession(uid: string): Promise<Result> {
  const p = await fetchProfile(uid)
  if (!p) {
    await db().auth.signOut()
    return fail('Bu hesap silinmiş. “Hesap oluştur” ile yeni hesap açabilirsiniz.')
  }
  if (p.status === 'pending') { await db().auth.signOut(); return fail('Diyetisyen başvurunuz inceleniyor. Yönetici onayladığında bu kullanıcı adı ve şifreyle giriş yapabilirsiniz.') }
  if (p.status === 'rejected') { await db().auth.signOut(); return fail('Diyetisyen başvurunuz onaylanmadı.') }
  if (p.status === 'inactive') { await db().auth.signOut(); return fail('Hesabınız yönetici tarafından pasife alındı. Yönetimle iletişime geçin.') }
  await pullAll(p)
  return { ok: true, session: sessionOf(p) }
}

export async function cloudLogin(userRaw: string, pw: string): Promise<Result> {
  const u = normUser(userRaw)
  if (!u || !pw) return fail('Kullanıcı adı ve şifre yazın.')
  try {
    const { data, error } = await db().auth.signInWithPassword({ email: emailOf(u), password: pw })
    if (error) {
      if (/invalid login/i.test(error.message)) return fail('Kullanıcı adı veya şifre hatalı.')
      if (/confirm/i.test(error.message)) return fail('E-posta doğrulaması açık: Supabase panelinde "Confirm email" seçeneğini kapatın.')
      if (error.status === 429) return fail('Çok fazla deneme. Biraz bekleyip tekrar deneyin.')
      return fail(error.message)
    }
    return await openSession(data.user.id)
  } catch (e) {
    return fail(`Sunucuya ulaşılamadı: ${e instanceof Error ? e.message : String(e)}`)
  }
}

/** Sayfa yenilenince açık oturumu geri yükler */
export async function cloudRestore(): Promise<Session | null> {
  try {
    const { data } = await db().auth.getSession()
    if (!data.session) return null
    const r = await openSession(data.session.user.id)
    return r.ok ? r.session : null
  } catch (e) {
    reportError(e)
    return null
  }
}

export async function cloudLogout() {
  try { await cloudFlush() } catch { /* sessiz */ }
  try { await db().auth.signOut() } catch { /* sessiz */ }
  ctx = null
  clearCache()
}

async function createAccount(i: { u: string; ad: string; p: string; p2: string; kind: 'danisan' | 'diyetisyen'; clientId?: string }): Promise<{ ok: true; uid: string; label: string } | { ok: false; error: string }> {
  const u = normUser(i.u)
  const ue = userError(u)
  if (ue) return fail(ue)
  if (u === 'diyetisyen') return fail('Bu kullanıcı adı ayrılmış. Başka bir kullanıcı adı seçin.')
  const ad = cleanName(i.ad)
  if (ad.length < 3) return fail('Ad soyad yazın.')
  const pe = pwError(i.p, i.p2)
  if (pe) return fail(pe)
  try {
    const { data, error } = await db().auth.signUp({ email: emailOf(u), password: i.p })
    if (error) {
      if (/registered|exists/i.test(error.message)) return fail('Bu kullanıcı adı kullanımda. Başka bir kullanıcı adı seçin ya da giriş yapın.')
      return fail(error.message)
    }
    if (!data.session || !data.user) return fail('Hesap oluşturulamadı: Supabase panelinde Authentication > Sign In / Providers > Email bölümünde "Confirm email" seçeneğini kapatın.')
    const { error: pe2 } = await db().from('profiles').insert({
      id: data.user.id, username: u, ad, kind: i.kind, client_id: i.clientId ?? null, status: i.kind === 'diyetisyen' ? 'pending' : null,
    })
    if (pe2) {
      await db().auth.signOut()
      return fail(/duplicate|unique/i.test(pe2.message) ? 'Bu kullanıcı adı kullanımda. Başka bir kullanıcı adı seçin.' : `Hesap kaydedilemedi: ${pe2.message}`)
    }
    return { ok: true, uid: data.user.id, label: ad }
  } catch (e) {
    return fail(`Sunucuya ulaşılamadı: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export async function cloudRegister(i: { u: string; ad: string; p: string; p2: string; kind: AccountKind; clientId?: string }): Promise<Result> {
  const r = await createAccount({ ...i, kind: 'danisan' })
  if (!r.ok) return r
  clearCache()
  ctx = { uid: r.uid, username: normUser(i.u), kind: 'danisan', clientId: i.clientId }
  // Diyetisyen listesi hemen dolsun (aksi halde bir sonraki girişe kadar boş kalırdı)
  try { await cloudRefreshDietitians() } catch { /* sessiz */ }
  return { ok: true, session: { u: normUser(i.u), label: r.label, kind: 'danisan', clientId: i.clientId } }
}

export async function cloudApply(i: { u: string; ad: string; p: string; p2: string; title: string; note: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!i.title.trim()) return fail('Unvan veya diploma bilginizi yazın.')
  const r = await createAccount({ ...i, kind: 'diyetisyen' })
  if (!r.ok) return r
  const { error } = await db().from('applications').insert({ username: normUser(i.u), name: r.label, title: i.title.trim(), note: i.note.trim() })
  await db().auth.signOut()
  if (error) return fail(`Başvuru kaydedilemedi: ${error.message}`)
  return { ok: true }
}

export async function cloudResetPassword(i: { u: string; ad: string; p: string; p2: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const pe = pwError(i.p, i.p2)
  if (pe) return fail(pe)
  const { data, error } = await db().rpc('reset_password', { p_username: normUser(i.u), p_ad: cleanName(i.ad), p_pass: i.p })
  if (error) return fail(`Şifre yenilenemedi: ${error.message}`)
  return data === true ? { ok: true } : fail('Kullanıcı adı ve ad soyad hesapla eşleşmiyor.')
}

export async function cloudChangePassword(i: { u: string; current: string; p: string; p2: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!i.current) return fail('Mevcut şifrenizi yazın.')
  const pe = pwError(i.p, i.p2)
  if (pe) return fail(pe)
  if (i.p === i.current) return fail('Yeni şifre mevcut şifreden farklı olmalı.')
  const chk = await db().auth.signInWithPassword({ email: emailOf(normUser(i.u)), password: i.current })
  if (chk.error) return fail('Mevcut şifre hatalı.')
  const { error } = await db().auth.updateUser({ password: i.p })
  return error ? fail(error.message) : { ok: true }
}

// ───────────── Yönetici işlemleri ─────────────
export async function cloudSetStatus(id: string, username: string | undefined, status: Application['status'], unvan?: string) {
  try {
    const a = await db().from('applications').update({ status, ...(unvan ? { unvan } : {}) }).eq('id', id)
    if (a.error) throw new Error(a.error.message)
    if (username) {
      const p = await db().from('profiles').update({ status: status === 'approved' ? null : status, ...(unvan ? { unvan } : {}) }).eq('username', username)
      if (p.error) throw new Error(p.error.message)
    }
  } catch (e) { reportError(e) }
}

/** Danışanın güncel tahlil sonuçlarını sunucudan okur (diyetisyenin yerel önbelleği eski kalabilir); okunamazsa null */
export async function cloudClientLabs(clientId: string): Promise<unknown[] | null> {
  if (!cloudEnabled) return null
  try {
    const { data, error } = await db().from('clients').select('data').eq('id', clientId).maybeSingle()
    if (error || !data) return null
    const lab = (data as { data: { lab?: unknown } }).data?.lab
    return Array.isArray(lab) ? lab : []
  } catch { return null }
}

// ───────────── Öğün fotoğrafları (Supabase Storage, özel kova) ─────────────
const PHOTO_BUCKET = 'meal-photos'

/** Fotoğrafı yükler; yol "danisanId/fotoId.jpg". Kova kurulmadıysa anlaşılır bir hata verir. */
export async function cloudUploadPhoto(clientId: string, id: string, blob: Blob): Promise<string> {
  const path = `${clientId}/${id}.jpg`
  const { error } = await db().storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error(/bucket|not found/i.test(error.message) ? 'Fotoğraf yüklenemedi: sunucu ayarı eksik (docs/SUPABASE.md, "Öğün fotoğrafları").' : `Fotoğraf yüklenemedi: ${error.message}`)
  return path
}

/** Resmi göstermek için 1 saatlik imzalı bağlantı üretir */
export async function cloudPhotoUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await db().storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600)
    return error ? null : data.signedUrl
  } catch { return null }
}

/** Süresi dolan fotoğrafları depodan siler (yalnızca danışan kendi klasöründekileri silebilir) */
export async function cloudDeletePhotos(paths: string[]) {
  if (!paths.length) return
  try { await db().storage.from(PHOTO_BUCKET).remove(paths) } catch (e) { console.warn('[bulut] fotoğraf silinemedi', e) }
}

/** Danışanın güncel günlük takibini sunucudan okur (diyetisyenin yerel önbelleği eski kalabilir); okunamazsa null */
export async function cloudClientTrack(clientId: string): Promise<Record<string, import('../features/clients/types').DayTrack> | null> {
  if (!cloudEnabled) return null
  try {
    const { data, error } = await db().from('clients').select('data').eq('id', clientId).maybeSingle()
    if (error || !data) return null
    const trk = (data as { data: { trk?: unknown } }).data?.trk
    return trk && typeof trk === 'object' ? (trk as Record<string, import('../features/clients/types').DayTrack>) : {}
  } catch { return null }
}

export async function cloudSetActive(username: string, active: boolean) {
  try {
    const p = await db().from('profiles').update({ status: active ? null : 'inactive' }).eq('username', username)
    if (p.error) throw new Error(/check|constraint/i.test(p.error.message) ? 'Pasife alma için Supabase şemasını güncelleyin (docs/SUPABASE.md, "Pasife alma").' : p.error.message)
  } catch (e) { reportError(e) }
}

/** Diyetisyen listesini sunucudan tazeler (yeni hesap açan danışan ve açık sekmeler için); yalnızca diyetisyen kayıtlarını günceller */
export async function cloudRefreshDietitians(): Promise<boolean> {
  if (!cloudEnabled) return false
  try {
    const rows = await ok<Profile[]>(db().from('profiles').select('*').eq('kind', 'diyetisyen'))
    const acc = load<Record<string, Account>>('dm.accounts', {})
    const next: Record<string, Account> = {}
    for (const [k, v] of Object.entries(acc)) if (v.kind !== 'diyetisyen') next[k] = v
    for (const p of rows) next[p.username] = toAccount(p)
    setRaw('dm.accounts', next)
    return true
  } catch (e) {
    console.warn('[bulut] diyetisyenler tazelenemedi', e)
    return false
  }
}

export async function cloudSetTitle(username: string, unvan: string) {
  try {
    const p = await db().from('profiles').update({ unvan }).eq('username', username)
    if (p.error) throw new Error(p.error.message)
    await db().from('applications').update({ unvan }).eq('username', username)
  } catch (e) { reportError(e) }
}

/** Hesabı (kullanıcı adı ya da bağlı danışan kaydıyla) sunucudan tamamen siler */
export async function cloudDeleteUser(target: { username?: string; client?: string }) {
  try {
    const r = await db().rpc('admin_delete_user', { p_username: target.username ?? null, p_client: target.client ?? null })
    if (r.error) throw new Error(r.error.message)
  } catch (e) { reportError(e) }
}

export async function cloudDeleteApplication(id: string) {
  try {
    const r = await db().from('applications').delete().eq('id', id)
    if (r.error) throw new Error(r.error.message)
  } catch (e) { reportError(e) }
}
