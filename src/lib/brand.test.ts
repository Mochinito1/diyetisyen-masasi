import { describe, expect, it } from 'vitest'
import { DEFAULT_BRAND, fillTemplate, firstName, kvkkAydinlatma, kvkkRiza, phoneIntl, smsHref, waHref } from './brand'

describe('marka ve mesajlar', () => {
  it('şablon doldurma ve boşluk toplama', () => {
    const m = fillTemplate(DEFAULT_BRAND.tpl, { ad: 'Ayşe', tarih: '18 Kasım', saat: '10:00', link: '', klinik: 'Klinik' })
    expect(m).toBe('Merhaba Ayşe, 18 Kasım saat 10:00 için randevunuz var.\nGörüşmek üzere. Klinik')
  })
  it('ilk ad ve örnek öneki', () => {
    expect(firstName('Örnek – Ayşe Demir')).toBe('Ayşe')
  })
  it('telefon biçimi', () => {
    expect(phoneIntl('0555 123 45 67')).toBe('905551234567')
    expect(phoneIntl('555 123')).toBeNull()
    expect(waHref('0555 123 45 67', 'a b')).toBe('https://wa.me/905551234567?text=a%20b')
    expect(smsHref('123', 'x')).toBeNull()
  })
  it('KVKK metinleri klinik adını içerir', () => {
    const b = { ...DEFAULT_BRAND, name: 'Dyt. Test', phone: '0555' }
    expect(kvkkAydinlatma(b)).toContain('Dyt. Test (iletişim: 0555)')
    expect(kvkkRiza(b, 'Ali Veli')).toContain('Ad soyad: Ali Veli')
    expect(kvkkRiza(b)).toContain('Ad soyad: ……………………')
  })
})