import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAuth } from './auth'

export type Role = 'admin' | 'diyetisyen' | 'danisan'

export const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Yönetici' },
  { id: 'diyetisyen', label: 'Diyetisyen' },
  { id: 'danisan', label: 'Danışan' },
]

interface Ctx {
  role: Role
  /** Yalnızca yönetici hesabı başka rol olarak görüntüleyebilir; diğer hesaplarda etkisizdir */
  setRole: (r: Role) => void
  canSwitch: boolean
}

const RoleContext = createContext<Ctx>({ role: 'diyetisyen', setRole: () => {}, canSwitch: false })
const KEY = 'dm.impRole'

/** Rol, giriş yapılan hesabın türünden gelir. Yönetici "hesabına gir" ile geçici olarak başka rol görür. */
export function RoleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [imp, setImp] = useState<Role>(() => {
    try { return (sessionStorage.getItem(KEY) as Role) || 'admin' } catch { return 'admin' }
  })
  const canSwitch = session?.kind === 'admin'
  const role: Role = !session ? 'diyetisyen' : canSwitch ? imp : session.kind
  const setRole = (r: Role) => {
    if (!canSwitch) return
    setImp(r)
    try { sessionStorage.setItem(KEY, r) } catch { /* gizli sekme */ }
  }
  return <RoleContext.Provider value={{ role, setRole, canSwitch }}>{children}</RoleContext.Provider>
}

export const useRole = () => useContext(RoleContext)