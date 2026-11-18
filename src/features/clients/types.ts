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
  /** Diyetisyenin belirlediği makro dağılımı: karbonhidrat ve protein yüzdesi (yağ kalan). Yoksa 50/20/30 */
  macro?: { c: number; p: number }
  /** Danışanın bağlı olduğu diyetisyenin kullanıcı adı (boşsa demo diyetisyen) */
  dietitian?: string
  /** Seçili hastalık, alerji ve diyet kimlikleri (rules.ts) */
  conds: string[]
  /** Hastalık/diyet seçiminde yanıtlanan gruplar ("Yok" da bir yanıttır); yanıtlanmayan grup "Bilinmiyor" sayılır */
  condsDone?: string[]
  /** Eski kayıtlar: tüm gruplar yanıtlandı mı? */
  condsSet?: boolean
  /** Hastalık/diyet seçimi yanıtlanan gruplar (\
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