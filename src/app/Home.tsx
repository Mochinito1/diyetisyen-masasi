import { Link } from 'react-router-dom'
import { navFor } from './nav'
import { ROLES, useRole } from './role'

const GREET = {
  admin: 'Yönetici paneli',
  diyetisyen: 'Diyetisyen paneli',
  danisan: 'Danışan portalı',
} as const

export default function Home() {
  const { role } = useRole()
  const label = ROLES.find((r) => r.id === role)!.label
  return (
    <div>
      <p className="text-sm font-semibold text-brand-500">{label} olarak görüntülüyorsunuz</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">{GREET[role]}</h1>
      <p className="mt-2 max-w-prose text-stone-600">
        Eğitim amaçlı bir araç. Veriler yalnızca bu tarayıcıda saklanır.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {navFor(role).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-brand-500"
          >
            <div className="font-display text-lg font-bold">{n.label}</div>
            <div className="mt-1 text-sm text-stone-500">{n.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}