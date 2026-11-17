import { createContext, useContext, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'

export type Role = 'admin' | 'diyetisyen' | 'danisan'

export const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Yönetici' },
  { id: 'diyetisyen', label: 'Diyetisyen' },
  { id: 'danisan', label: 'Danışan' },
]

interface Ctx {
  role: Role
  setRole: (r: Role) => void
}

const RoleContext = createContext<Ctx>({ role: 'diyetisyen', setRole: () => {} })
const KEY = 'dm.role'

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => load<Role>(KEY, 'diyetisyen'))
  const setRole = (r: Role) => {
    setRoleState(r)
    save(KEY, r)
  }
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export const useRole = () => useContext(RoleContext)