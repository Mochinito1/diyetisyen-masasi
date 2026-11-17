import { Link } from 'react-router-dom'
import { NAV } from './nav'

export default function Home() {
  return (
    <div>
      <h1 className="font-display text-4xl font-bold tracking-tight">Hoş geldin</h1>
      <p className="mt-2 max-w-prose text-stone-600">
        Danışan takibi, kalori hesabı ve menü planlama için eğitim amaçlı bir araç. Veriler
        yalnızca bu tarayıcıda saklanır.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {NAV.map((n) => (
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