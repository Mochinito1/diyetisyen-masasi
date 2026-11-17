import { fmt } from '../../lib/format'
import { fmtDay } from '../../lib/dossier'

/** Tarih/değer çizgi grafiği (SVG); tema renklerini kullanır */
export default function LineChart({ points, digits, unit }: { points: { d: string; v: number }[]; digits: number; unit: string }) {
  const W = 620, H = 160, pl = 46, pr = 16, pt = 14, pb = 26
  const ts = points.map((p) => new Date(`${p.d}T12:00:00`).getTime())
  const vs = points.map((p) => p.v)
  const t0 = Math.min(...ts), t1 = Math.max(...ts)
  let lo = Math.min(...vs), hi = Math.max(...vs)
  const pad = Math.max((hi - lo) * 0.15, digits === 2 ? 0.02 : 0.5)
  lo -= pad
  hi += pad
  const X = (t: number) => (t1 === t0 ? (pl + W - pr) / 2 : pl + ((t - t0) / (t1 - t0)) * (W - pl - pr))
  const Y = (v: number) => pt + ((hi - v) / (hi - lo)) * (H - pt - pb)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik" className="block h-auto w-full">
      {[lo, (lo + hi) / 2, hi].map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={Y(v)} y2={Y(v)} className="stroke-stone-200" strokeWidth="1" />
          <text x={pl - 6} y={Y(v) + 4} textAnchor="end" className="fill-stone-500 text-[11px]">{fmt(v, digits)}</text>
        </g>
      ))}
      {points.length > 1 && (
        <polyline fill="none" className="stroke-brand-500" strokeWidth="2.5" strokeLinejoin="round" points={points.map((p, i) => `${X(ts[i])},${Y(p.v)}`).join(' ')} />
      )}
      {points.map((p, i) => (
        <circle key={p.d} cx={X(ts[i])} cy={Y(p.v)} r="4" className="fill-brand-500">
          <title>{`${fmtDay(p.d)}: ${fmt(p.v, digits)} ${unit}`}</title>
        </circle>
      ))}
      <text x={pl} y={H - 6} textAnchor="start" className="fill-stone-500 text-[11px]">{fmtDay(points[0].d)}</text>
      <text x={W - pr} y={H - 6} textAnchor="end" className="fill-stone-500 text-[11px]">{fmtDay(points[points.length - 1].d)}</text>
    </svg>
  )
}