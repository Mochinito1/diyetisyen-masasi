import type { Role } from './role'

export interface NavItem {
  to: string
  label: string
  desc: string
  roles: Role[]
}

export const NAV: NavItem[] = [
  { to: '/danisanlar', label: 'Danışanlar', desc: 'Kayıt ve takip', roles: ['admin', 'diyetisyen'] },
  { to: '/hesaplama', label: 'Hesaplama', desc: 'BMH, kalori, makro', roles: ['admin', 'diyetisyen'] },
  { to: '/besinler', label: 'Besinler', desc: 'TürKomp besin listesi', roles: ['admin', 'diyetisyen'] },
  { to: '/menu', label: 'Menü', desc: 'Haftalık plan', roles: ['admin', 'diyetisyen', 'danisan'] },
  { to: '/randevu', label: 'Randevu', desc: 'Takvim', roles: ['admin', 'diyetisyen', 'danisan'] },
  { to: '/profil', label: 'Profil', desc: 'Hedefin ve ölçülerin', roles: ['danisan'] },
  { to: '/ayarlar', label: 'Ayarlar', desc: 'Klinik, mesajlar, KVKK, yedek', roles: ['admin', 'diyetisyen', 'danisan'] },
  { to: '/yonetim', label: 'Yönetim', desc: 'Hesaplar ve başvurular', roles: ['admin'] },
]

export const navFor = (role: Role) => NAV.filter((n) => n.roles.includes(role))