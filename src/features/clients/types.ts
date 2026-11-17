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
  /** Danışan ilk giriş bilgilerini tamamladı mı */
  onb?: boolean
  /** KVKK onay tarihleri (boşsa onaylanmadı) */
  kvkk: { ay: string; riza: string }
  /** Danışan portalı takibi: gün -> yenen öğünler ve su (bardak) */
  trk: Record<string, { m: string[]; su: number }>
  /** Danışanın bağlı olduğu diyetisyenin kullanıcı adı (boşsa demo diyetisyen) */
  dietitian?: string
  /** Seçili hastalık, alerji ve diyet kimlikleri (rules.ts) */
  conds: string[]
  /** Hastalık/diyet seçimi yapıldı mı? (Yok da bir seçimdir) */
  condsSet?: boolean
  /** Hastalık/diyet seçimi yapıldı mı? (\
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