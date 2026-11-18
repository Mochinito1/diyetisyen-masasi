import { beforeEach, describe, expect, it } from 'vitest'

const mem = () => {
  const s: Record<string, string> = {}
  return { get length() { return Object.keys(s).length }, key: (i: number) => Object.keys(s)[i] ?? null, getItem: (k: string) => s[k] ?? null, setItem: (k: string, v: string) => { s[k] = v }, removeItem: (k: string) => { delete s[k] }, clear: () => {} } as Storage
}
const g = globalThis as unknown as { localStorage: Storage; sessionStorage: Storage }
beforeEach(() => { g.localStorage = mem(); g.sessionStorage = mem() })

describe('diyetisyen dizini', async () => {
  const d = await import('./dietitians')
  const a = await import('./auth')

  it('demo diyetisyen her zaman listede, onaylı hesaplar eklenir, bekleyenler eklenmez', async () => {
    expect(d.listDietitians().map((x) => x.u)).toEqual(['diyetisyen'])
    await a.submitApplication({ u: 'dytbir', ad: 'Bir Dyt', p: '12345678', p2: '12345678', title: 'Dyt.', note: '' })
    expect(d.listDietitians().map((x) => x.u)).toEqual(['diyetisyen'])
    const id = JSON.parse(localStorage.getItem(a.APPS_KEY)!)[0].id
    a.setApplicationStatus(id, 'approved')
    expect(d.listDietitians().map((x) => x.u)).toEqual(['diyetisyen', 'dytbir'])
  })

  it('veri sahibi: diyetisyen kendisi, yönetici demo, danışan seçtiği', () => {
    expect(d.ownerOf({ u: 'dytbir', label: '', kind: 'diyetisyen' })).toBe('dytbir')
    expect(d.ownerOf({ u: 'admin', label: '', kind: 'admin' })).toBe('diyetisyen')
    localStorage.setItem('dm.clients', JSON.stringify([{ id: 'c1', dietitian: 'dytbir' }, { id: 'c2' }]))
    expect(d.ownerOf({ u: 'x', label: '', kind: 'danisan', clientId: 'c1' })).toBe('dytbir')
    expect(d.ownerOf({ u: 'y', label: '', kind: 'danisan', clientId: 'c2' })).toBe('diyetisyen')
  })

  it('danışan kaydı yalnızca seçtiği diyetisyene aittir', () => {
    expect(d.ownerOfClient({ dietitian: 'dytbir' })).toBe('dytbir')
    expect(d.ownerOfClient({ dietitian: '' })).toBe('')
    expect(d.ownerOfClient({})).toBe('diyetisyen')
  })

  it('saklama anahtarları: demo eski anahtarı korur', () => {
    expect(d.brandKey('diyetisyen')).toBe('dm.brand')
    expect(d.brandKey('dytbir')).toBe('dm.brand.dytbir')
    expect(d.availabilityKey('dytbir')).toBe('dm.availability.dytbir')
  })
})