import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { makeClient } from '../features/clients/factory'
import { todayStr } from '../lib/appointments'
import { sampleClients } from '../lib/samples'
import {
  DEMO_CLIENT_ID, authenticate, loadSession, register as doRegister, resetAccountsOnce, resetPassword as doReset, saveSession, submitApplication,
  type Session,
} from '../lib/auth'
import { cloudEnabled, cloudFlush, cloudLogout, cloudRestore } from '../lib/cloud'
import { load, save } from '../lib/storage'
import type { Client } from '../features/clients/types'

interface AuthCtx {
  session: Session | null
  /** Bulut modunda açık oturum geri yüklenene kadar false */
  ready: boolean
  /** Yönetici başka bir diyetisyen hesabını görüntülüyorsa o oturum */
  imp: Session | null
  startImp: (s: Session) => void
  stopImp: () => void
  login: (u: string, p: string) => Promise<string>
  register: (i: { u: string; ad: string; p: string; p2: string; kvkk: boolean; riza: boolean }) => Promise<string>
  apply: (i: { u: string; ad: string; p: string; p2: string; title: string; note: string }) => Promise<string>
  reset: (i: { u: string; ad: string; p: string; p2: string }) => Promise<string>
  logout: () => void
}

const Ctx = createContext<AuthCtx>({
  session: null, ready: true, imp: null, startImp: () => {}, stopImp: () => {},
  login: async () => '', register: async () => '', apply: async () => '', reset: async () => '', logout: () => {},
})

const IMP_KEY = 'dm.impAs'
const loadImp = (): Session | null => {
  try { return JSON.parse(sessionStorage.getItem(IMP_KEY) ?? 'null') } catch { return null }
}

/** Demo danışanın örnek verili kaydını (yoksa) oluşturur (yalnızca yerel mod) */
function ensureDemoClient() {
  const list = load<Client[]>('dm.clients', [])
  if (list.some((c) => c.id === DEMO_CLIENT_ID)) return
  const s = sampleClients()[0]
  save('dm.clients', [{ ...s, id: DEMO_CLIENT_ID, name: 'Demo Danışan', onb: true, dietitian: '', kvkk: { ay: todayStr(), riza: '' } }, ...list])
}

/** Bulutta danışan kaydı yoksa (örn. ilk kayıt yarım kaldıysa) boş bir kayıt açılır */
function ensureOwnClient(s: Session) {
  if (!s.clientId) return
  const list = load<Client[]>('dm.clients', [])
  if (list.some((c) => c.id === s.clientId)) return
  save('dm.clients', [{ ...makeClient(s.label, s.clientId), dietitian: '' }, ...list])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [real, setReal] = useState<Session | null>(() => {
    if (cloudEnabled) return null
    resetAccountsOnce()
    return loadSession()
  })
  const [ready, setReady] = useState(!cloudEnabled)
  const [imp, setImp] = useState<Session | null>(() => loadImp())

  // Bulut modu: açık oturumu geri yükle ve sunucudaki veriyi indir
  useEffect(() => {
    if (!cloudEnabled) return
    let off = false
    cloudRestore().then((s) => {
      if (off) return
      if (s?.kind === 'danisan') ensureOwnClient(s)
      setReal(s)
      setReady(true)
    })
    return () => { off = true }
  }, [])

  const session = real?.kind === 'admin' && imp ? imp : real

  const start = (s: Session) => {
    if (s.kind === 'danisan') {
      if (!cloudEnabled && s.clientId === DEMO_CLIENT_ID) ensureDemoClient()
      if (cloudEnabled) ensureOwnClient(s)
      if (s.clientId) save('dm.asClient', s.clientId)
    }
    if (!cloudEnabled) saveSession(s)
    setReal(s)
    // Bilgilerini henüz doldurmamış danışan ilk girişte Profil'e yönlendirilir
    const me = s.kind === 'danisan' ? load<Client[]>('dm.clients', []).find((c) => c.id === s.clientId) : undefined
    location.hash = me && !me.onb ? '#/profil' : '#/'
  }

  const value: AuthCtx = {
    session,
    ready,
    imp: real?.kind === 'admin' ? imp : null,
    startImp: (s) => {
      try { sessionStorage.setItem(IMP_KEY, JSON.stringify(s)) } catch { /* gizli sekme */ }
      setImp(s)
      location.hash = '#/'
    },
    stopImp: () => {
      try { sessionStorage.removeItem(IMP_KEY) } catch { /* gizli sekme */ }
      setImp(null)
      location.hash = '#/yonetim'
    },
    login: async (u, p) => {
      const r = await authenticate(u, p)
      if (!r.ok) return r.error
      start(r.session)
      return ''
    },
    register: async (i) => {
      if (!i.kvkk) return 'Hesap oluşturmak için KVKK aydınlatma metnini okuyup onaylayın.'
      if (!i.riza) return 'Hesap oluşturmak için açık rıza metnini okuyup onaylayın.'
      // Hesap danışan hesabıdır; ona bağlı bir danışan kaydı oluşturulur
      const clientId = crypto.randomUUID()
      const r = await doRegister({ ...i, kind: 'danisan', clientId })
      if (!r.ok) return r.error
      // KVKK ve açık rıza hesap açılırken alınır; danışan formlarında tekrar sorulmaz
      const created = { ...makeClient(i.ad.trim().replace(/\s+/g, ' '), clientId), dietitian: '', kvkk: { ay: todayStr(), riza: todayStr() } }
      save('dm.clients', [created, ...load<Client[]>('dm.clients', [])])
      await cloudFlush()
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
      try { sessionStorage.removeItem(IMP_KEY) } catch { /* gizli sekme */ }
      setImp(null)
      if (cloudEnabled) void cloudLogout()
      else saveSession(null)
      setReal(null)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
