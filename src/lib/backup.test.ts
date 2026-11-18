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
  it('diyetisyen yedeği başka diyetisyenin danışanlarını, hesapları ve seçmemiş danışanı içermez', () => {
    store['dm.clients'] = JSON.stringify([{ id: 'a', dietitian: 'x' }, { id: 'b', dietitian: 'y' }, { id: 'c', dietitian: '' }, { id: 'd' }])
    store['dm.appointments'] = JSON.stringify([{ id: '1', clientId: 'a', dietitian: 'x' }, { id: '2', clientId: 'b', dietitian: 'y' }])
    store['dm.accounts'] = '{}'
    store['dm.brand.y'] = '{}'
    const d = JSON.parse(exportData('x')).data
    expect(d['dm.clients']).toEqual([{ id: 'a', dietitian: 'x' }])
    expect(d['dm.appointments']).toEqual([{ id: '1', clientId: 'a', dietitian: 'x' }])
    expect(d['dm.accounts']).toBeUndefined()
    expect(d['dm.brand.y']).toBeUndefined()
    // Eski kayıtlar (alan yok) demo diyetisyene aittir
    expect(JSON.parse(exportData('diyetisyen')).data['dm.clients']).toEqual([{ id: 'd' }])
  })
  it('diyetisyen geri yüklemesi başkasının verisini ezmez', () => {
    store['dm.clients'] = JSON.stringify([{ id: 'b', dietitian: 'y', name: 'Y' }])
    const file = JSON.stringify({ app: 'diyetisyen-masasi', data: { 'dm.clients': [{ id: 'b', dietitian: 'x', name: 'ele geçir' }, { id: 'a', dietitian: 'x' }], 'dm.accounts': { z: 1 } } })
    importData(file, 'x')
    expect(JSON.parse(store['dm.clients'])).toEqual([{ id: 'b', dietitian: 'y', name: 'Y' }, { id: 'a', dietitian: 'x' }])
    expect(store['dm.accounts']).toBeUndefined()
  })
  it('geçersiz dosya reddedilir', () => {
    expect(importData('x').ok).toBe(false)
    expect(importData('{"app":"baska"}').ok).toBe(false)
  })
})