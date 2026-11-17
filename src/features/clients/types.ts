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