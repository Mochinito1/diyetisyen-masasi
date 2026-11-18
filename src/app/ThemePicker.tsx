import { useEffect, useRef, useState } from 'react'
import { THEMES, useTheme } from './theme'

/** Tema seçici: düğme + açılır liste (klavye ve dokunmatik uyumlu) */
export default function ThemePicker({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent | TouchEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down)
    document.addEventListener('touchstart', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('touchstart', down)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Tema seç"
        aria-haspopup="true"
        aria-expanded={open}
        title="Tema"
        className="grid h-9 w-9 flex-none place-items-center rounded-full border border-stone-200 bg-white text-stone-900 hover:border-brand-500 hover:text-brand-500 sm:h-[38px] sm:w-[38px]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="13.5" cy="6.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /><circle cx="8.5" cy="7.5" r="1" /><circle cx="6.5" cy="12.5" r="1" />
          <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a5 5 0 0 0 5-5c0-4.4-4.5-8.4-10-8.4z" />
        </svg>
      </button>
      {open && (
        <div role="menu" aria-label="Tema seçenekleri" className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              onClick={() => { setTheme(t.id); setOpen(false) }}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-semibold ${theme === t.id ? 'bg-brand-50 text-brand-500' : 'text-stone-900 hover:bg-stone-100'}`}
            >
              <span className="relative h-6 w-6 flex-none overflow-hidden rounded-full border border-stone-300" style={{ background: t.swatch[1] }} aria-hidden="true">
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-tl-full" style={{ background: t.swatch[0] }} />
              </span>
              <span className="flex-1">{t.label}</span>
              {theme === t.id && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
