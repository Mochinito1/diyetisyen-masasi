import { beforeEach, describe, expect, it } from 'vitest'

const mem = () => {
  const s: Record<string, string> = {}
  return {
    get length() { return Object.keys(s).length },
    key: (i: number) => Object.keys(s)[i] ?? null,
    getItem: (k: string) => s[k] ?? null,
    setItem: (k: string, v: string) => { s[k] = v },
    removeItem: (k: string) => { delete s[k] },
    clear: () => { for (const k of Object.keys(s)) delete s[k] },
  } as Storage
}
const g = globalThis as unknown as { localStorage: Storage; sessionStorage: Storage }

beforeEach(() => {
  g.localStorage = mem()
  g.sessionStorage = mem()
})

describe('hesaplar', async () => {
  const a = await import('./auth')

  it('şifre özeti tuza bağlı ve tekrarlanabilir', async () => {
    const h1 = await a.hashPw('Sifre-12345', 'tuz')
    expect(h1).toHaveLength(64)
    expect(await a.hashPw('Sifre-12345', 'tuz')).toBe(h1)
    expect(await a.hashPw('Sifre-12345', 'baska')).not.toBe(h1)
  })

  it('demo hesaplar giriş yapar', async () => {
    // Demo diyetisyen kaldırıldı: eski şifreyle giriş yapılamaz
    expect((await a.authenticate('Diyetisyen', 'Diyet2026!')).ok).toBe(false)
    const d = await a.authenticate('danisan', 'Danisan2026!')
    expect(d.ok && d.session.clientId).toBe(a.DEMO_CLIENT_ID)
    const m = await a.authenticate('admin', 'Yonetim-Kx7#2026')
    expect(m.ok && m.session.kind).toBe('admin')
  })

  it('kayıt ve giriş: yanlış şifre reddedilir', async () => {
    const r = await a.register({ u: 'AyseY', ad: 'Ayşe Yılmaz', p: 'gizli-sifre1', p2: 'gizli-sifre1', kind: 'diyetisyen' })
    expect(r.ok).toBe(true)
    expect((await a.authenticate('aysey', 'gizli-sifre1')).ok).toBe(true)
    const bad = await a.authenticate('aysey', 'yanlis-sifre')
    expect(bad.ok).toBe(false)
    a.resetLock()
  })

  it('doğrulamalar', async () => {
    expect((await a.register({ u: 'a', ad: 'Ali Veli', p: '12345678', p2: '12345678', kind: 'danisan' })).ok).toBe(false)
    expect((await a.register({ u: 'aliveli', ad: 'Ali Veli', p: '123', p2: '123', kind: 'danisan' })).ok).toBe(false)
    expect((await a.register({ u: 'aliveli', ad: 'Ali Veli', p: '12345678', p2: '87654321', kind: 'danisan' })).ok).toBe(false)
    expect((await a.register({ u: 'admin', ad: 'Ali Veli', p: '12345678', p2: '12345678', kind: 'danisan' })).ok).toBe(false)
    await a.register({ u: 'aliveli', ad: 'Ali Veli', p: '12345678', p2: '12345678', kind: 'danisan' })
    expect((await a.register({ u: 'aliveli', ad: 'Ali Veli', p: '12345678', p2: '12345678', kind: 'danisan' })).ok).toBe(false)
  })

  it('şifre yenileme ad soyad ister', async () => {
    await a.register({ u: 'veliali', ad: 'Veli Ali', p: 'eski-sifre1', p2: 'eski-sifre1', kind: 'danisan' })
    expect((await a.resetPassword({ u: 'veliali', ad: 'Baska Kisi', p: 'yeni-sifre1', p2: 'yeni-sifre1' })).ok).toBe(false)
    expect((await a.resetPassword({ u: 'veliali', ad: 'veli ali', p: 'yeni-sifre1', p2: 'yeni-sifre1' })).ok).toBe(true)
    expect((await a.authenticate('veliali', 'yeni-sifre1')).ok).toBe(true)
    a.resetLock()
  })

  it('diyetisyen başvurusu: onaya kadar giriş yok, onayla açılır, reddedilirse kapanır', async () => {
    const r = await a.submitApplication({ u: 'dytbasvuru', ad: 'Zeynep Aydın', p: 'basvuru-sifre1', p2: 'basvuru-sifre1', title: 'Dyt., Test Üniv.', note: '' })
    expect(r.ok).toBe(true)
    const apps = JSON.parse(localStorage.getItem(a.APPS_KEY)!)
    expect(apps).toHaveLength(1)
    expect(apps[0]).toMatchObject({ u: 'dytbasvuru', status: 'pending', title: 'Dyt., Test Üniv.' })

    let l = await a.authenticate('dytbasvuru', 'basvuru-sifre1')
    expect(l.ok).toBe(false)
    expect(!l.ok && l.error).toContain('inceleniyor')

    a.setApplicationStatus(apps[0].id, 'approved')
    l = await a.authenticate('dytbasvuru', 'basvuru-sifre1')
    expect(l.ok && l.session.kind).toBe('diyetisyen')

    a.setApplicationStatus(apps[0].id, 'rejected')
    l = await a.authenticate('dytbasvuru', 'basvuru-sifre1')
    expect(!l.ok && l.error).toContain('onaylanmadı')

    a.removeApplication(apps[0].id)
    expect(JSON.parse(localStorage.getItem(a.APPS_KEY)!)).toHaveLength(0)
    expect(a.loadAccounts()['dytbasvuru']).toBeUndefined()
    a.resetLock()
  })

  it('başvuruda unvan zorunlu', async () => {
    const r = await a.submitApplication({ u: 'dytx', ad: 'Ali Veli', p: '12345678', p2: '12345678', title: ' ', note: '' })
    expect(r.ok).toBe(false)
  })

  it('şifre değişikliği: mevcut şifre doğrulanır', async () => {
    await a.register({ u: 'sifreci', ad: 'Sifre Ci', p: 'eski-sifre-1', p2: 'eski-sifre-1', kind: 'danisan' })
    expect((await a.changePassword({ u: 'sifreci', current: 'yanlis-sifre', p: 'yeni-sifre-1', p2: 'yeni-sifre-1' })).ok).toBe(false)
    expect((await a.changePassword({ u: 'sifreci', current: 'eski-sifre-1', p: 'kisa', p2: 'kisa' })).ok).toBe(false)
    expect((await a.changePassword({ u: 'sifreci', current: 'eski-sifre-1', p: 'eski-sifre-1', p2: 'eski-sifre-1' })).ok).toBe(false)
    expect((await a.changePassword({ u: 'sifreci', current: 'eski-sifre-1', p: 'yeni-sifre-1', p2: 'yeni-sifre-1' })).ok).toBe(true)
    expect((await a.authenticate('sifreci', 'yeni-sifre-1')).ok).toBe(true)
    expect((await a.authenticate('sifreci', 'eski-sifre-1')).ok).toBe(false)
    a.resetLock()
  })

  it('demo hesabın şifresi değiştirilemez', async () => {
    expect((await a.changePassword({ u: 'danisan', current: 'Danisan2026!', p: 'yeni-sifre-1', p2: 'yeni-sifre-1' })).ok).toBe(false)
  })

  it('oturum kaydı', () => {
    a.saveSession({ u: 'x', label: 'X', kind: 'danisan' })
    expect(a.loadSession()?.u).toBe('x')
    a.saveSession(null)
    expect(a.loadSession()).toBeNull()
  })
})