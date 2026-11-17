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
    const r = await a.authenticate('Diyetisyen', 'Diyet2026!')
    expect(r.ok && r.session.kind).toBe('diyetisyen')
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

  it('oturum kaydı', () => {
    a.saveSession({ u: 'x', label: 'X', kind: 'danisan' })
    expect(a.loadSession()?.u).toBe('x')
    a.saveSession(null)
    expect(a.loadSession()).toBeNull()
  })
})