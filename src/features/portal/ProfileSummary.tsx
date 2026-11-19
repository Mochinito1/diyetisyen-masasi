import { fmt } from '../../lib/format'
import { calculate, sodiumLimit, type CalcInput } from '../../lib/formulas'
import MacroEditor from './MacroEditor'

const FORMULA = { mifflin: 'Mifflin-St Jeor', harris: 'Harris-Benedict', schofield: 'Schofield (FAO/WHO)' } as const
const PILL = { ok: 'bg-emerald-100 text-emerald-800', warn: 'bg-amber-100 text-amber-800', bad: 'bg-red-100 text-red-800' } as const
const SEGMENT_NAMES: [number, number, string][] = [[15, 18.5, 'Zayıf'], [18.5, 25, 'Normal'], [25, 30, 'Fazla kilolu'], [30, 40, 'Obez']]

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
  <div className="rounded-xl border border-stone-200 bg-white p-3.5">{children}</div>
)
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-bold uppercase tracking-[0.06em] opacity-70">{children}</div>
)

function Kpi({ label, value, unit, sub, main, subClass = '' }: { label: string; value: string; unit?: string; sub?: string; main?: boolean; subClass?: string }) {
  return (
    <div className={`flex h-full min-w-0 flex-col rounded-lg px-3 py-2 ${main ? 'bg-brand-500 text-white' : 'bg-stone-100'}`}>
      <Label>{label}</Label>
      <div className="font-display text-[22px] font-bold leading-tight">
        {value}
        {unit && <small className="ml-1 font-sans text-xs font-semibold opacity-70">{unit}</small>}
      </div>
      {sub && <div className={`mt-auto pt-0.5 text-xs ${main ? 'opacity-85' : 'text-stone-500'} ${subClass}`}>{sub}</div>}
    </div>
  )
}

/** Danışan profili: diyetisyenin belirlediği hedeflerin salt okunur özeti (göstergeler, BKİ çubuğu, makro dağılımı) */
export const DEFAULT_MACRO = { c: 50, p: 20 }

/** onMacro verilirse (diyetisyen) makro dağılımı kaydırıcılarla değiştirilebilir; verilmezse (danışan) salt okunurdur. */
export default function ProfileSummary({ input, macroPct = DEFAULT_MACRO, onMacro }: { input: CalcInput; macroPct?: { c: number; p: number }; onMacro?: (m: { c: number; p: number }) => void }) {
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
  const h = input.heightCm!
  const w = input.weightKg!
  const gap = w > r.idealHi ? w - r.idealHi : w < r.idealLo ? w - r.idealLo : 0
  const inRange = w >= r.idealLo && w <= r.idealHi
  const status = inRange ? 'Mevcut kilo normal aralıkta.' : w < r.idealLo ? 'Mevcut kilo bu aralığın altında.' : 'Mevcut kilo bu aralığın üzerinde.'
  const wk = r.weeklyKg
  const editable = !!onMacro

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Kpi main label="Günlük hedef" value={fmt(r.target!)} unit="kcal" sub={adj === 0 ? 'BMH × aktivite' : `BMH × aktivite ${adj > 0 ? '+' : '−'} ${fmt(Math.abs(adj))} kcal`} />
          <Kpi label="Beden kitle indeksi" value={fmt(r.bmi, 1)} unit="kg/m²" sub={r.category} subClass="font-semibold" />
          <Kpi label="Bazal metabolizma" value={fmt(r.bmr!)} unit="kcal" sub={FORMULA[r.formula!]} />
          <Kpi label="Toplam harcama" value={fmt(r.tdee!)} unit="kcal" sub={`Aktivite katsayısı ${fmt(input.activity, 3)}`} />
        </div>
      </Card>

      <div className="space-y-3">
      <Card>
        <h2 className="font-display text-base font-bold">Kilo/boy indeksi</h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-2xl font-bold tabular-nums">{fmt(r.bmi, 1)}</span>
          <span className="text-sm text-stone-500">kg/m²</span>
          {r.category && <span className={`ml-auto rounded-full px-3 py-1 text-sm font-semibold ${r.tone ? PILL[r.tone] : ''}`}>{r.category}</span>}
        </div>

        <div className="relative mb-8 mt-7">
          <div className="flex h-2.5 gap-0.5">
            {SEGMENTS.map(([a, b, cls], i) => (
              <i key={a} className={`block h-full ${cls} ${i === 0 ? 'rounded-l-full' : ''} ${i === SEGMENTS.length - 1 ? 'rounded-r-full' : ''}`} style={{ width: `${((b - a) / (MAX - MIN)) * 100}%` }} />
            ))}
          </div>
          {SEGMENT_NAMES.map(([a, b, name]) => (
            <span key={name} className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-stone-500" style={{ left: `${(pos(a) + pos(b)) / 2}%` }}>{name}</span>
          ))}
          <div className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-stone-50 bg-stone-900 shadow-md transition-[left] duration-300" style={{ left: `${pos(r.bmi)}%` }} role="img" aria-label={`BKİ ${fmt(r.bmi, 1)}`} />
          {TICKS.map((t) => (
            <span key={t} className="absolute top-6 -translate-x-1/2 text-[10.5px] text-stone-500" style={{ left: `${pos(t)}%` }}>{fmt(t, t % 1 ? 1 : 0)}</span>
          ))}
        </div>

        {r.adult ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {([
              ['Mevcut kilo', `${fmt(w, 1)} kg`, ''],
              ['Sağlıklı aralık', `${fmt(r.idealLo, 1)}–${fmt(r.idealHi, 1)}`, 'kg'],
              [gap === 0 ? 'Durum' : gap > 0 ? 'Verilecek' : 'Alınacak', gap === 0 ? 'Aralıkta' : `${fmt(Math.abs(gap), 1)} kg`, ''],
            ] as const).map(([l, v, u]) => (
              <div key={l} className="min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5">
                <div className="truncate text-[11px] font-semibold text-stone-500">{l}</div>
                <div className="font-display text-sm font-bold tabular-nums">{v}{u && <small className="ml-0.5 font-sans text-[11px] font-semibold text-stone-500">{u}</small>}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">Çocuk ve ergenlerde BKİ, yaş ve cinsiyete göre büyüme eğrileriyle değerlendirilir; diyetisyenine danış.</p>
        )}
        {r.adult && <p className="mt-2 text-xs text-stone-500">{status} (boy {fmt(h)} cm)</p>}
        {wk != null && (
          <p className="mt-1 text-xs text-stone-500">
            {wk === 0 ? 'Seçilen hedef kilonun korunmasıdır; haftalık değişim beklenmez.' : `Seçilen hedefle tahmini haftalık değişim yaklaşık ${fmt(Math.abs(wk), 2)} kg ${wk < 0 ? 'azalış' : 'artış'}.`}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-base font-bold">Makro dağılımı</h2>
        <p className="mb-3 text-xs text-stone-500">Günlük {fmt(r.target!)} kcal hedefinin dağılımı</p>
        <MacroEditor target={r.target!} value={macroPct} onChange={onMacro} />
        {editable && (
          <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500">Günlük sodyum üst sınırı: {fmt(sodiumLimit(input.age!, r.target!))} mg</p>
        )}
      </Card>
      </div>

      {r.warns.length > 0 && (
        <ul className="space-y-2">
          {r.warns.map((x) => <li key={x} className="rounded-xl bg-amber-100 p-3 text-sm text-amber-800">{x}</li>)}
        </ul>
      )}
    </div>
  )
}