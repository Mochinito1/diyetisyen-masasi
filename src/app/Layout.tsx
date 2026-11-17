import { NavLink, Link, Outlet } from 'react-router-dom'
import { navFor } from './nav'
import { ROLES, useRole } from './role'

export default function Layout() {
  const { role, setRole } = useRole()
  return (
    <div className="min-h-screen">
      <div className="bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-1.5 text-xs">
          <span className="font-semibold opacity-70">Şu rol olarak görüntüle:</span>
          <div className="flex overflow-hidden rounded-full border border-stone-600">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={`px-3 py-1 font-semibold transition ${
                  role === r.id ? 'bg-brand-500 text-white' : 'text-stone-300 hover:bg-stone-800'
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}