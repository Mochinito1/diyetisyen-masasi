import { beforeEach, describe, expect, it } from 'vitest'
import { exportData, importData } from './backup'

const store: Record<string, string> = {}
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
  ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
  }
})

describe('yedekleme', () => {
  it('yalnızca dm. anahtarlarını dışa aktarır ve geri yükler', () => {
    store['dm.clients'] = JSON.stringify([{ id: 'a' }])
    store['baska'] = '1'
    const json = exportData()
    expect(JSON.parse(json).data).toEqual({ 'dm.clients': [{ id: 'a' }] })
    delete store['dm.clients']
    const r = importData(json)
    expect(r).toEqual({ ok: true, keys: 1 })
    expect(JSON.parse(store['dm.clients'])).toEqual([{ id: 'a' }])
  })
  it('geçersiz dosya reddedilir', () => {
    expect(importData('x').ok).toBe(false)
    expect(importData('{"app":"baska"}').ok).toBe(false)
  })
})