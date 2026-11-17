import { fmt } from '../../lib/format'
import { calculate, macros, type CalcInput } from '../../lib/formulas'

const FORMULA = { mifflin: 'Mifflin-St Jeor', harris: 'Harris-Benedict', schofield: 'Schofield (FAO/WHO)' } as const
const TONE = { ok: 'text-emerald-800', warn: 'text-amber-800', bad: 'text-red-800' } as const

/** BKİ çubuğunun gösterdiği aralık ve renkli bölümleri */
const MIN = 15
const MAX = 40
const SEGMENTS: [from: number, to: number, cls: string][] = [
  [MIN, 18.5, 'bg-amber-700/40'],
  [18.5, 25, 'bg-brand-500'],
  [25, 30, 'bg-amber-700/40'],
  [30, MAX, 'bg-red-700/50'],
]
const TICKS = [18.5, 25, 30, 35, 40]
const pos = (v: number) => ((Math.min(Math.max(v, MIN), MAX) - MIN) / (MAX - MIN)) * 100

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-stone-200 bg-white p-4 md:p-5">{children}</div>
)
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-70">{children}</div>
)

function Kpi({ label, value, unit, sub, main, subClass = '' }: { label: string; value: string; unit?: string; sub?: string; main?: boolean; subClass?: string }) {
  return (
    <div className={`min-w-0 rounded-[9px] px-3.5 py-3 ${main ? 'bg-brand-500 text-white' : 'bg-stone-100'}`}>
      <Label>{label}</Label>
      <div className="mt-0.5 font-display text-[28px] font-bold leading-tight">
        {value}
        {unit && <small className="ml-1 font-sans text-[13px] font-semibold opacity-70">{unit}</small>}
      </div>
      {sub && <div className={`text-xs ${main ? 'opacity-85' : 'text-stone-500'} ${subClass}`}>{sub}</div>}
    </div>
  )
}

/** Danışan profili: diyetisyenin belirlediği hedeflerin salt okunur özeti (göstergeler, BKİ çubuğu, makro dağılımı) */
export default function ProfileSummary({ input, macroPct = { c: 50, p: 20 } }: { input: CalcInput; macroPct?: { c: number; p: number } }) {
  const r = calculate(input)
  if (!r)
    return <Card><p className="text-stone-500">Diyetisyenin bilgilerini tamamladığında hedeflerin burada görünecek.</p></Card>

  if (r.infant)
    return (
      <div className="space-y-3">
        <Card><Kpi label="Beden kitle indeksi" value={fmt(r.bmi, 1)} unit="kg/m²" /></Card>
        <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-800">1 yaş altında enerji ihtiyacı bu araçla hesaplanmaz. Büyüme eğrilerini ve güncel EER tablolarını kullanın.</p>
      </div>
    )

  const adj = r.adj ?? 0
  const m = macros(r.target!, macroPct.c, macroPct.p)
  const h = input.heightCm!
  const w = input.weightKg!
  const inRange = w >= r.idealLo && w <= r.idealHi
  const status = inRange ? 'Mevcut kilo normal aralıkta.' : w < r.idealLo ? 'Mevcut kilo bu aralığın altında.' : 'Mevcut kilo bu aralığın üzerinde.'
  const wk = r.weeklyKg

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi main label="Günlük hedef" value={fmt(r.target!)} unit="kcal" sub={adj === 0 ? 'BMH × aktivite' : `BMH × aktivite ${adj > 0 ? '+' : '−'} ${fmt(Math.abs(adj))} kcal`} />
          <Kpi label="Beden kitle indeksi" value={fmt(r.bmi, 1)} unit="kg/m²" sub={r.category} subClass={`font-semibold ${r.tone ? TONE[r.tone] : ''}`} />
          <Kpi label="Bazal metabolizma" value={fmt(r.bmr!)} unit="kcal" sub={FORMULA[r.formula!]} />
          <Kpi label="Toplam harcama" value={fmt(r.tdee!)} unit="kcal" sub={`Aktivite katsayısı ${fmt(input.activity, 3)}`} />
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Kilo/boy indeksi</h2>
        <div className="relative mb-7 mt-9 flex h-3 rounded-md">
          {SEGMENTS.map(([a, b, cls], i) => (
            <i key={a} className={`block h-full ${cls} ${i === 0 ? 'rounded-l-md' : ''} ${i === SEGMENTS.length - 1 ? 'rounded-r-md' : ''}`} style={{ width: `${((b - a) / (MAX - MIN)) * 100}%` }} />
          ))}
          <div className="absolute -top-2 h-7 w-[3px] -translate-x-1/2 rounded bg-stone-900" style={{ left: `${pos(r.bmi)}%` }} aria-label={`BKİ ${fmt(r.bmi, 1)}`}>
            <b className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-stone-900 px-2 py-px text-xs text-stone-50">{fmt(r.bmi, 1)}</b>
          </div>
          {TICKS.map((t) => (
            <span key={t} className="absolute top-4 -translate-x-1/2 text-[10.5px] text-stone-500" style={{ left: `${pos(t)}%` }}>{fmt(t, t % 1 ? 1 : 0)}</span>
          ))}
        </div>
        {r.adult ? (
          <p className="text-sm">Boy {fmt(h)} cm için sağlıklı kilo aralığı <b>{fmt(r.idealLo, 1)}–{fmt(r.idealHi, 1)} kg</b>. {status}</p>
        ) : (
          <p className="text-sm text-stone-500">Çocuk ve ergenlerde BKİ, yaş ve cinsiyete göre büyüme eğrileriyle değerlendirilir; diyetisyenine danış.</p>
        )}
        {wk != null && (
          <p className="mt-1 text-xs text-stone-500">
            {wk === 0 ? 'Seçilen hedef kilonun korunmasıdır; haftalık değişim beklenmez.' : `Seçilen hedefle tahmini haftalık değişim yaklaşık ${fmt(Math.abs(wk), 2)} kg ${wk < 0 ? 'azalış' : 'artış'}.`}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-bold">Makro dağılımı</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi label="Karbonhidrat" value={fmt(m.carbG)} unit="g" sub={`%${m.carbPct}`} />
          <Kpi label="Protein" value={fmt(m.proteinG)} unit="g" sub={`%${m.proteinPct}`} />
          <Kpi label="Yağ" value={fmt(m.fatG)} unit="g" sub={`%${m.fatPct}`} />
        </div>
      </Card>

      {r.warns.length > 0 && (
        <ul className="space-y-2">
          {r.warns.map((x) => <li key={x} className="rounded-xl bg-amber-100 p-3 text-sm text-amber-800">{x}</li>)}
        </ul>
      )}
    </div>
  )
}