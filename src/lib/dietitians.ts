import { loadAccounts, demoLabel, withTitle, DEMO, type Session } from './auth'
import { load } from './storage'

/** Eski ve demo veriler bu diyetisyene aittir */
export const DEMO_DIETITIAN = DEMO.dyt[0]

export interface DietitianInfo {
  u: string
  label: string
}

/** Danışanın seçebileceği diyetisyenler: demo diyetisyen ve onaylı (etkin) diyetisyen hesapları */
export function listDietitians(): DietitianInfo[] {
  const list: DietitianInfo[] = [{ u: DEMO_DIETITIAN, label: demoLabel() }]
  for (const a of Object.values(loadAccounts())) if (a.kind === 'diyetisyen' && !a.status) list.push({ u: a.u, label: withTitle(a) })
  return list
}

/** Verilerin sahibi olan diyetisyen: diyetisyen hesabı kendisi, yönetici demo diyetisyen, danışan seçtiği diyetisyen */
export function ownerOf(session: Session | null): string {
  if (!session || session.kind === 'admin') return DEMO_DIETITIAN
  if (session.kind === 'diyetisyen') return session.u
  const c = load<{ id: string; dietitian?: string }[]>('dm.clients', []).find((x) => x.id === session.clientId)
  return c?.dietitian ?? DEMO_DIETITIAN
}

/** Diyetisyene özel klinik ayarlarının saklama anahtarı (demo diyetisyen eski anahtarı kullanır) */
export const brandKey = (owner: string) => (owner === DEMO_DIETITIAN ? 'dm.brand' : `dm.brand.${owner}`)
export const availabilityKey = (owner: string) => (owner === DEMO_DIETITIAN ? 'dm.availability' : `dm.availability.${owner}`)