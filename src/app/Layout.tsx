import { useEffect, useRef } from 'react'
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import NavIcon from './NavIcon'
import { navFor } from './nav'
import { ROLES, useRole } from './role'
import { useAuth } from './auth'
import ThemePicker from './ThemePicker'
import CloudBanner from './CloudBanner'

const item = ({ isActive }: { isActive: boolean }) =>
  `nav-link flex min-w-16 flex-1 shrink-0 snap-start flex-col items-center gap-0.5 px-0.5 py-1 text-[11.5px] font-semibold rounded-xl outline-none focus-visible:bg-brand-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 ${isActive ? 'text-brand-500' : 'text-stone-500'}`
const pill = (active: boolean) => `grid h-7 w-[46px] place-items-center rounded-2xl ${active ? 'bg-brand-50' : ''}`

export default function Layout() {
  const { role, setRole, canSwitch } = useRole()
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  // Mobilde kaydırılan menüde etkin sekme her zaman görünür olsun
  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [pathname, role])
  const { session, logout, imp, stopImp } = useAuth()
  // Danışan menüsü soldan sağa: Profil, Menü, Anasayfa, Randevu, Ayarlar
  const home = { to: '/', short: 'Anasayfa', icon: 'home' as const }
  const items = [home, ...navFor(role)]
  const ORDER = ['/profil', '/menu', '/', '/randevu', '/ayarlar']
  const navItems = role === 'danisan' ? [...items].sort((a, b) => ORDER.indexOf(a.to) - ORDER.indexOf(b.to)) : items
  return (
    <div className="min-h-screen">
      <CloudBanner />
      {imp && (
        <div className="bg-[#0a0f0d] text-[#e5eee8]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-1 text-xs md:px-6 lg:px-8">
            <span className="font-semibold">{imp.label} hesabını yönetici olarak görüntülüyorsunuz.</span>
            <button onClick={stopImp} className="ml-auto rounded-full bg-brand-500 px-3 py-0.5 font-semibold text-[#ffffff]">Yönetime dön</button>
          </div>
        </div>
      )}
      {canSwitch && <div className="bg-[#0a0f0d] text-[#e5eee8]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-1 text-xs md:px-6 lg:px-8">
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

      <header className="border-stone-200 bg-stone-50 max-md:contents md:sticky md:top-0 md:z-20 md:border-b">
        <div className="mx-auto max-w-[1600px] px-4 max-md:contents md:px-6 lg:px-8">
          <div className="relative flex min-h-[52px] max-md:px-4 items-center justify-between gap-2 py-1.5 sm:justify-center sm:pt-2.5">
            <Link to="/" className="min-w-0 truncate font-display text-base font-bold leading-tight text-stone-900 sm:text-[17px] md:text-xl" aria-label="Anasayfa">Diyetisyen Masası</Link>
            <div className="flex flex-none items-center gap-1.5 sm:absolute sm:right-0 sm:top-1.5 sm:gap-2">
              <span className="max-w-[4.75rem] truncate text-[13px] font-bold text-stone-900 min-[400px]:max-w-[6.5rem] sm:max-w-[16rem] sm:text-base" title={session?.label}>{session?.label}</span>
              <button onClick={logout} aria-label="Çıkış" title="Çıkış" className="grid h-9 w-9 flex-none place-items-center rounded-full border border-stone-200 bg-white hover:border-brand-500 hover:text-brand-500 sm:h-auto sm:w-auto sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs sm:font-semibold">
                <svg className="sm:hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
                <span className="hidden sm:inline">Çıkış</span>
              </button>
              <ThemePicker />
            </div>
          </div>
          <nav ref={navRef} aria-label="Ana menü" className="max-md:sticky max-md:top-0 max-md:z-20 max-md:border-b max-md:border-stone-200 max-md:bg-stone-50 max-md:[mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-28px),transparent)] flex snap-x gap-0.5 overflow-x-auto px-3 pb-1.5 pt-0.5 [scrollbar-width:none] md:mx-auto md:max-w-4xl md:px-0 [&::-webkit-scrollbar]:hidden">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={item}>
                {({ isActive }) => (<><span className={pill(isActive)}><NavIcon name={n.icon} /></span><span className="max-w-full truncate">{n.short}</span></>)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-6 md:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
