import { NavLink, Link, Outlet } from 'react-router-dom'
import { navFor } from './nav'
import { ROLES, useRole } from './role'
import { useTheme } from './theme'

export default function Layout() {
  const { role, setRole } = useRole()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <div className="min-h-screen">
      <div className="bg-[#0a0f0d] text-[#e5eee8]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-1.5 text-xs">
          <span className="font-semibold opacity-70">Şu rol olarak görüntüle:</span>
          <div className="flex overflow-hidden rounded-full border border-[#3a4b42]">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={`px-3 py-1 font-semibold transition ${
                  role === r.id ? 'bg-brand-500 text-white' : 'text-[#b3c2b9] hover:bg-[#1b2923]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="ml-auto opacity-50">Test modu</span>
        </div>
      </div>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="font-display text-xl font-bold text-brand-500">
            Diyetisyen Masası
          </Link>
          <nav className="flex flex-wrap gap-1">
            {navFor(role).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    isActive ? 'bg-brand-500 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={toggle}
            aria-label={dark ? 'Açık temaya geç' : 'Karanlık temaya geç'}
            title="Tema"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-stone-300 text-stone-600 hover:border-brand-500 hover:text-brand-500"
          >
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}