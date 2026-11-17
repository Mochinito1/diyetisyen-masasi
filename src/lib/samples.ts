import { EMPTY_ANAMNESIS } from './dossier'
import type { Client } from '../features/clients/types'

const day = (back: number) => {
  const d = new Date()
  d.setDate(d.getDate() - back)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Deneme için örnek danışanlar. Adları "Örnek – " ile başlar, gerçek veri girilmez. */
export function sampleClients(): Client[] {
  const base = { an: { ...EMPTY_ANAMNESIS }, lab: [], sess: [], menu: [], mnote: '', notes: '', trk: {}, kvkk: { ay: '', riza: '' }, created: Date.now(), updated: Date.now() }
  return [
    {
      ...base, id: crypto.randomUUID(), name: 'Örnek – Ayşe Demir', tel: '', email: '', conds: ['diyabet'], onb: true,
      profile: { sex: 'K', age: '38', h: '165', w: '78', act: '1.375', goal: '-500', phys: 'none', formula: 'auto' },
      meas: [{ d: day(60), w: 82, b: 96, k: 108 }, { d: day(30), w: 80, b: 94, k: 107 }, { d: day(2), w: 78, b: 92, k: 106 }],
    },
    {
      ...base, id: crypto.randomUUID(), name: 'Örnek – Mehmet Kaya', tel: '', email: '', conds: ['hipertansiyon'], onb: true,
      profile: { sex: 'E', age: '52', h: '178', w: '92', act: '1.2', goal: '-500', phys: 'none', formula: 'auto' },
      meas: [{ d: day(45), w: 96 }, { d: day(10), w: 92 }],
    },
  ]
}