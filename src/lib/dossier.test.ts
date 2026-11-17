import { describe, expect, it } from 'vitest'
import type { Appointment } from './appointments'
import { labFlag, lastVisit, latestWeight, mergeMeas, parseCsv, pnum, seriesOf, waistHip } from './dossier'

describe('ölçümler', () => {
  const meas = [{ d: '2026-01-01', w: 80, b: 90, k: 100 }, { d: '2026-02-01', w: 78 }, { d: '2026-03-01', b: 88, k: 100 }]
  it('seri: yalnızca değeri olan ölçümler', () => {
    expect(seriesOf(meas, 'w')).toHaveLength(2)
    expect(seriesOf(meas, 'o').map((x) => x.v)).toEqual([0.9, 0.88])
  })
  it('bel/kalça eşiği cinsiyete göre', () => {
    expect(waistHip({ d: 'x', b: 90, k: 100 }, 'K')!.high).toBe(true)
    expect(waistHip({ d: 'x', b: 90, k: 100 }, 'E')!.high).toBe(false)
    expect(waistHip({ d: 'x', b: 90 }, 'K')).toBeNull()
  })
  it('son kilo', () => {
    expect(latestWeight(meas)).toBe(78)
  })
  it('aynı gün ölçümler birleşir ve tarihe göre sıralanır', () => {
    const r = mergeMeas([{ d: '2026-02-01', w: 78 }], [{ d: '2026-01-01', w: 80 }, { d: '2026-02-01', b: 85 }])
    expect(r).toEqual([{ d: '2026-01-01', w: 80 }, { d: '2026-02-01', w: 78, b: 85 }])
  })
  it('pnum aralık ve virgül', () => {
    expect(pnum('72,5', 2, 500)).toBe(72.5)
    expect(pnum('1', 2, 500)).toBeNull()
    expect(pnum('', 2, 500)).toBeNull()
  })
})

describe('tahlil bayrakları', () => {
  it('eşikler', () => {
    expect(labFlag('Açlık kan şekeri', 105, 'K')).toBe('Yüksek')
    expect(labFlag('Açlık kan şekeri', 65, 'K')).toBe('Düşük')
    expect(labFlag('HDL', 45, 'K')).toBe('Düşük')
    expect(labFlag('HDL', 45, 'E')).toBe('')
    expect(labFlag('TSH', 99, 'K')).toBe('')
  })
})

describe('CSV içe aktarma', () => {
  it('noktalı virgül, Türkçe tarih ve virgüllü sayı', () => {
    const r = parseCsv('Tarih;Kilo;Bel\n16.11.2026;72,5;80\n17.11.2026;72,1;')
    expect(r.rows).toEqual([{ d: '2026-11-16', w: 72.5, b: 80 }, { d: '2026-11-17', w: 72.1 }])
  })
  it('virgül ayırıcı ve ISO tarih', () => {
    expect(parseCsv('date,weight\n2026-11-16,70').rows).toEqual([{ d: '2026-11-16', w: 70 }])
  })
  it('tarih sütunu yoksa hata', () => {
    expect(parseCsv('kilo\n70').error).toBeDefined()
  })
  it('aralık dışı değer atılır', () => {
    expect(parseCsv('tarih;kilo\n2026-11-16;1').rows).toEqual([])
  })
})

describe('son görüşme', () => {
  const ap = (d: string, status: Appointment['status']): Appointment => ({
    id: d, clientId: 'c', clientName: '', dt: `${d}T10:00`, type: 'yuz', link: '', note: '', status, by: 'diyetisyen', created: 0,
  })
  const c = { id: 'c', meas: [{ d: '2026-02-01', w: 70 }], sess: [{ id: '1', d: '2026-03-01', t: '' }], created: 0 }
  it('en yeni tarih seçilir; yalnızca "geldi" randevuları sayılır', () => {
    expect(lastVisit(c, [ap('2026-04-01', 'done'), ap('2026-05-01', 'plan')])).toBe('2026-04-01')
    expect(lastVisit(c, [])).toBe('2026-03-01')
  })
})