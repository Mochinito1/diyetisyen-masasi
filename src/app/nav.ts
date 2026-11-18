import type { IconName } from './NavIcon'
import type { Role } from './role'

export interface NavItem {
  to: string
  label: string
  /** Kısa ad (menü çubuğu) */
  short: string
  desc: string
  icon: IconName
  roles: Role[]
}

export const NAV: NavItem[] = [
  { to: '/danisanlar', label: 'Danışan Bilgileri', short: 'Danışan', desc: 'Kayıt ve takip', icon: 'danisan', roles: ['admin', 'diyetisyen'] },
  { to: '/hesaplama', label: 'Hesaplama', short: 'Hesap', desc: 'BMH, kalori, makro', icon: 'hesap', roles: ['admin', 'diyetisyen'] },
  { to: '/besinler', label: 'Besin Listesi', short: 'Besinler', desc: 'TürKomp besin listesi', icon: 'besinler', roles: ['admin', 'diyetisyen'] },
  { to: '/menu', label: 'Menü Planı', short: 'Menü', desc: 'Günlük plan', icon: 'menu', roles: ['admin', 'diyetisyen', 'danisan'] },
  { to: '/randevu', label: 'Randevu ve Takip', short: 'Randevu', desc: 'Takvim', icon: 'randevu', roles: ['admin', 'diyetisyen', 'danisan'] },
  { to: '/profil', label: 'Profil', short: 'Profil', desc: 'Hedefin ve ölçülerin', icon: 'danisan', roles: ['danisan'] },
  { to: '/ayarlar', label: 'Kliniğim', short: 'Ayarlar', desc: 'Klinik, mesajlar, KVKK, yedek', icon: 'disli', roles: ['admin', 'diyetisyen', 'danisan'] },
  { to: '/yonetim', label: 'Yönetim', short: 'Yönetim', desc: 'Hesaplar ve başvurular', icon: 'kalkan', roles: ['admin'] },
]

/** Danışanda "Kliniğim" (diyetisyenin klinik ayarları) yerine kendi "Ayarlar" sayfası vardır */
const CLIENT_OVERRIDES: Record<string, Partial<NavItem>> = {
  '/ayarlar': { label: 'Ayarlar', desc: 'Bilgilerin ve hesabın' },
}

export const navFor = (role: Role): NavItem[] =>
  NAV.filter((n) => n.roles.includes(role)).map((n) => (role === 'danisan' ? { ...n, ...CLIENT_OVERRIDES[n.to] } : n))