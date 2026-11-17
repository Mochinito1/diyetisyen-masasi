import type { Anamnesis, LabResult, Measurement, SessionNote } from '../../lib/dossier'
import type { MenuItem } from '../../lib/menu'
import type { Profile } from '../calculator/profile'

export interface Client {
  id: string
  name: string
  tel: string
  email: string
  profile: Profile
  /** Genel (tarihsiz) notlar */
  notes: string
  /** Danışanın menüsü ve danışana not */
  menu: MenuItem[]
  mnote: string
  /** KVKK onay tarihleri (boşsa onaylanmadı) */
  kvkk: { ay: string; riza: string }
  /** Danışan portalı takibi: gün -> yenen öğünler ve su (bardak) */
  trk: Record<string, { m: string[]; su: number }>
  /** Seçili hastalık, alerji ve diyet kimlikleri (rules.ts) */
  conds: string[]
  /** Danışan dosyası */
  an: Anamnesis
  meas: Measurement[]
  lab: LabResult[]
  sess: SessionNote[]
  /** Elle işaretlenen son görüşme (YYYY-MM-DD) */
  lv?: string
  created: number
  updated: number
}