import { describe, expect, it } from 'vitest'
import { parseLabText } from './labParse'

const REPORT = `
Laboratuvar Raporu
Numune Kabul Tarihi: 12.11.2026
Glukoz (Açlık) 92 mg/dL 70 - 100
HbA1c 5,8 % 4.0 - 5.6
Total Kolesterol 214 mg/dL < 200
LDL Kolesterol 142 mg/dL < 130
HDL Kolesterol 38 mg/dL > 40
VLDL Kolesterol 28 mg/dL
Trigliserid 190 mg/dL < 150
TSH 2,10 mIU/L 0.27 - 4.2
Ferritin 25,4 ng/mL
Hemoglobin 13,2 g/dL
Vitamin B12 310 pg/mL
25-OH Vitamin D 18,5 ng/mL
Kreatinin 0,82 mg/dL
Ürik Asit 5,1 mg/dL
`

describe('parseLabText', () => {
  const r = parseLabText(REPORT)
  const get = (k: string) => r.found.find((x) => x.k === k)

  it('tarihi okur', () => expect(r.date).toBe('2026-11-12'))
  it('bilinen tetkikleri bulur', () => {
    expect(get('Açlık kan şekeri')?.v).toBe(92)
    expect(get('HbA1c')?.v).toBe(5.8)
    expect(get('Total kolesterol')?.v).toBe(214)
    expect(get('Trigliserid')?.v).toBe(190)
    expect(get('TSH')?.v).toBe(2.1)
    expect(get('Ferritin')?.v).toBe(25.4)
    expect(get('Hemoglobin')?.v).toBe(13.2)
    expect(get('B12')?.v).toBe(310)
    expect(get('D vitamini')?.v).toBe(18.5)
    expect(get('Kreatinin')?.v).toBe(0.82)
    expect(get('Ürik asit')?.v).toBe(5.1)
  })
  it('LDL, HDL ve VLDL karışmaz', () => {
    expect(get('LDL')?.v).toBe(142)
    expect(get('HDL')?.v).toBe(38)
    expect(r.found.filter((x) => x.k === 'LDL')).toHaveLength(1)
  })
  it('HbA1c satırı hemoglobin sayılmaz', () => expect(get('Hemoglobin')?.v).toBe(13.2))
  it('birimi okur ve yazımını düzeltir', () => {
    expect(get('TSH')?.u).toBe('mIU/L')
    expect(get('HbA1c')?.u).toBe('%')
    expect(get('LDL')?.u).toBe('mg/dL')
  })
  it('büyük küçük harf ve Türkçe karakter farkını tolere eder', () => {
    const x = parseLabText('ACLIK KAN SEKERI 101 mg/dl\nTRİGLİSERİD 120 mg/dl')
    expect(x.found.map((y) => y.v)).toEqual([101, 120])
  })
  it('anlamsız değerleri almaz, tanınmayan satırları yok sayar', () => {
    const x = parseLabText('Hemoglobin 900 g/dL\nBilinmeyen test 5 mg/dL')
    expect(x.found).toHaveLength(0)
    expect(x.date).toBeNull()
  })
})
