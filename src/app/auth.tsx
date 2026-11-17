import { createContext, useContext, useState, type ReactNode } from 'react'
import { makeClient } from '../features/clients/factory'
import { sampleClients } from '../lib/samples'
import {
  DEMO_CLIENT_ID, authenticate, loadSession, register as doRegister, resetPassword as doReset, saveSession, submitApplication,
  type Session,
} from '../lib/auth'
import { load, save } from '../lib/storage'
import type { Client } from '../features/clients/types'

interface AuthCtx {
  session: Session | null
  login: (u: string, p: string) => Promise<string>
  register: (i: { u: string; ad: string; p: string; p2: string }) => Promise<string>
  apply: (i: { u: string; ad: string; p: string; p2: string; title: string; note: string }) => Promise<string>
  reset: (i: { u: string; ad: string; p: string; p2: string }) => Promise<string>
  logout: () => void
}

const Ctx = createContext<AuthCtx>({ session: null, login: async () => '', register: async () => '', apply: async () => '', reset: async () => '', logout: () => {} })

/** Demo danışanın örnek verili kaydını (yoksa) oluşturur */
function ensureDemoClient() {
  const list = load<Client[]>('dm.clients', [])
  if (list.some((c) => c.id === DEMO_CLIENT_ID)) return
  const s = sampleClients()[0]
  save('dm.clients', [{ ...s, id: DEMO_CLIENT_ID, name: 'Demo Danışan', onb: true }, ...list])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const start = (s: Session) => {
    if (s.kind === 'danisan') {
      if (s.clientId === DEMO_CLIENT_ID) ensureDemoClient()
      if (s.clientId) save('dm.asClient', s.clientId)
    }
    saveSession(s)
    setSession(s)
    location.hash = '#/'
  }

  const value: AuthCtx = {
    session,
    login: async (u, p) => {
      const r = await authenticate(u, p)
      if (!r.ok) return r.error
      start(r.session)
      return ''
    },
    register: async (i) => {
      // Hesap danışan hesabıdır; ona bağlı bir danışan kaydı oluşturulur
      const clientId = crypto.randomUUID()
      const r = await doRegister({ ...i, kind: 'danisan', clientId })
      if (!r.ok) return r.error
      save('dm.clients', [makeClient(i.ad.trim().replace(/\s+/g, ' '), clientId), ...load<Client[]>('dm.clients', [])])
      start(r.session)
      return ''
    },
    apply: async (i) => {
      const r = await submitApplication(i)
      return r.ok ? '' : r.error
    },
    reset: async (i) => {
      const r = await doReset(i)
      return r.ok ? '' : r.error
    },
    logout: () => {
      saveSession(null)
      setSession(null)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)