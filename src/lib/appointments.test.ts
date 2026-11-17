import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AVAILABILITY, addMonths, canCancel, effectiveStatus, isDayAvailable, monthGrid, slotRange, slotsFor, type Appointment,
} from './appointments'

// 2026-03-02 Pazartesi, 10:00 yerel
const now = new Date(2026, 2, 2, 10, 0)
const ap = (dt: string, status: Appointment['status'] = 'pending'): Appointment => ({
  id: 'a', clientId: 'c', clientName: 'Test', dt, type: 'yuz', link: '', note: '', status, by: 'danisan', created: 0,
})

describe('randevu saatleri', () => {
  it('çalışma saatlerinden 30 dakikalık dilimler üretir', () => {
    const s = slotsFor('2026-03-03', DEFAULT_AVAILABILITY, new Set(), now)
    expect(s[0]).toBe('09:00')
    expect(s[s.length - 1]).toBe('16:30')
    expect(s).toHaveLength(16)
  })
  it('kapalı günde (hafta sonu) saat yok', () => {
    expect(slotsFor('2026-03-07', DEFAULT_AVAILABILITY, new Set(), now)).toEqual([])
  })
  it('dolu saatler çıkarılır', () => {
    const s = slotsFor('2026-03-03', DEFAULT_AVAILABILITY, new Set(['2026-03-03T09:00']), now)
    expect(s).not.toContain('09:00')
  })
  it('bugün geçmiş saatler çıkarılır', () => {
    const s = slotsFor('2026-03-02', DEFAULT_AVAILABILITY, new Set(), now)
    expect(s[0]).toBe('10:30')
  })
  it('geçmiş ve 90 günden uzak günler seçilemez', () => {
    expect(isDayAvailable('2026-03-01', DEFAULT_AVAILABILITY, new Set(), now)).toBe(false)
    expect(isDayAvailable('2026-03-03', DEFAULT_AVAILABILITY, new Set(), now)).toBe(true)
    expect(isDayAvailable('2026-09-01', DEFAULT_AVAILABILITY, new Set(), now)).toBe(false)
  })
  it('aralık metni', () => {
    expect(slotRange('09:30', 30)).toBe('09:30 – 10:00')
  })
})

describe('24 saat kuralı', () => {
  it('24 saatten fazlaysa iptal edilebilir', () => {
    expect(canCancel(ap('2026-03-04T10:00'), now.getTime())).toBe(true)
    expect(canCancel(ap('2026-03-03T09:00'), now.getTime())).toBe(false)
  })
  it('onay bekleyen randevu 24 saat kala kendiliğinden onaylanır', () => {
    expect(effectiveStatus(ap('2026-03-04T10:00'), now.getTime())).toBe('pending')
    expect(effectiveStatus(ap('2026-03-03T09:00'), now.getTime())).toBe('plan')
    expect(effectiveStatus(ap('2026-03-03T09:00', 'cancel'), now.getTime())).toBe('cancel')
  })
})

describe('takvim', () => {
  it('mart 2026 pazartesi başlangıçlı: 6 boş hücre, 31 gün', () => {
    expect(monthGrid('2026-03')).toEqual({ lead: 6, days: 31 })
  })
  it('ay ekleme yıl devreder', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })
})