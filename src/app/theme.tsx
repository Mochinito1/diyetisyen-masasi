import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { load, save } from '../lib/storage'

export type Theme = 'light' | 'dark' | 'ocean' | 'sunset' | 'lavender' | 'midnight'

export const THEMES: { id: Theme; label: string; dark: boolean; swatch: [string, string] }[] = [
  { id: 'light', label: 'Orman (açık)', dark: false, swatch: ['#1d6a50', '#f4f7f4'] },
  { id: 'dark', label: 'Orman (koyu)', dark: true, swatch: ['#5cc49b', '#0e1613'] },
  { id: 'ocean', label: 'Okyanus', dark: false, swatch: ['#1e5fa8', '#f3f6fa'] },
  { id: 'midnight', label: 'Gece mavisi', dark: true, swatch: ['#6aa7ff', '#0d141f'] },
  { id: 'sunset', label: 'Gün batımı', dark: false, swatch: ['#b4531a', '#faf6f1'] },
  { id: 'lavender', label: 'Lavanta', dark: false, swatch: ['#6a45b8', '#f6f4fa'] },
]

const KEY = 'dm.theme'
const valid = (t: unknown): t is Theme => THEMES.some((x) => x.id === t)

const systemTheme = (): Theme =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = load<Theme | null>(KEY, null)
    return valid(stored) ? stored : systemTheme()
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES.find((t) => t.id === theme)?.swatch[1] ?? '#f4f7f4')
  }, [theme])

  const setTheme = (t: Theme) => {
    save(KEY, t)
    setThemeState(t)
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
