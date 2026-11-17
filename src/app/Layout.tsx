import { NavLink, Link, Outlet } from 'react-router-dom'
import NavIcon from './NavIcon'
import { navFor } from './nav'
import { ROLES, useRole } from './role'
import { useAuth } from './auth'
import { useTheme } from './theme'

const item = ({ isActive }: { isActive: boolean }) =>
  `flex min-w-14 flex-1 flex-col items-center gap-0.5 px-0.5 py-1 text-[11.5px] font-semibold ${isActive ? 'text-brand-500' : 'text-stone-500'}`
const pill = (active: boolean) => `grid h-7 w-[46px] place-items-center rounded-2xl ${active ? 'bg-brand-50' : ''}`

export default function Layout() {
  const { role, setRole, canSwitch } = useRole()
  const { session, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <div className="min-h-screen">
      {canSwitch && <div className="bg-[#0a0f0d] text-[#e5eee8]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-1 text-xs">
          <span className="hidden font-semibold opacity-70 sm:inline">Şu rol olarak görüntüle:</span>
          <span className="font-semibold opacity-70 sm:hidden">Rol:</span>
          <div className="flex overflow-hidden rounded-full border border-[#3a4b42]">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={`px-3 py-0.5 font-semibold transition ${role === r.id ? 'bg-brand-500 text-white' : 'text-[#b3c2b9] hover:bg-[#1b2923]'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="ml-auto hidden opacity-50 sm:inline">Yönetici: başka hesap olarak görüntüleme</span>
        </div>
      </div>}

      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative flex items-center justify-center pt-2.5">
            <Link to="/" className="font-display text-[17px] font-bold leading-tight text-stone-900 md:text-xl" aria-label="Anasayfa">Diyetisyen Masası</Link>
            <div className="absolute left-0 top-1.5 flex items-center gap-2">
              <button onClick={logout} className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold hover:border-brand-500 hover:text-brand-500">Çıkış</button>
              <span className="hidden max-w-40 truncate text-xs font-semibold text-stone-500 md:inline">{session?.label}</span>
            </div>
            <button
              onClick={toggle}
              aria-label={dark ? 'Açık temaya geç' : 'Karanlık temaya geç'}
              title="Tema"
              className="absolute right-0 top-1.5 grid h-[38px] w-[38px] place-items-center rounded-full border border-stone-200 bg-white text-stone-900 hover:border-brand-500 hover:text-brand-500"
            >
              {dark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
          </div>
          <nav aria-label="Ana menü" className="mx-auto flex max-w-3xl gap-0.5 overflow-x-auto pb-1.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <NavLink to="/" end className={item}>
              {({ isActive }) => (<><span className={pill(isActive)}><NavIcon name="home" /></span><span>Anasayfa</span></>)}
            </NavLink>
            {navFor(role).map((n) => (
              <NavLink key={n.to} to={n.to} className={item}>
                {({ isActive }) => (<><span className={pill(isActive)}><NavIcon name={n.icon} /></span><span className="max-w-full truncate">{n.short}</span></>)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] md:py-8">
        <Outlet />
      </main>
    </div>
  )
}