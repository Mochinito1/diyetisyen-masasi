import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'

export type Theme = 'light' | 'dark'
const KEY = 'dm.theme'

const systemTheme = (): Theme =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => load<Theme | null>(KEY, null) ?? systemTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      save(KEY, next)
      return next
    })

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)