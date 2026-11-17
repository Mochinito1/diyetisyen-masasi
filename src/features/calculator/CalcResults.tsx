import { useState } from 'react'
import { calculate, macros, sodiumLimit, type CalcInput } from '../../lib/formulas'
import { fmt } from '../../lib/format'

const FORMULA_NAME = { mifflin: 'Mifflin-St Jeor', harris: 'Harris-Benedict', schofield: 'Schofield' } as const
const TONE = { ok: 'bg-emerald-100 text-emerald-800', warn: 'bg-amber-100 text-amber-800', bad: 'bg-red-100 text-red-800' } as const

export default function CalcResults({ input }: { input: CalcInput }) {
  const [carb, setCarb] = useState(50)
  const [prot, setProt] = useState(20)
  const r = calculate(input)

  if (!r)
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
        Cinsiyet, yaş, boy ve kilo girince sonuçlar burada görünür.
      </div>
    )

  if (r.infant)
    return (
      <div className="space-y-3">
        <Stat label="BKİ" value={fmt(r.bmi, 1)} unit="kg/m²" />
        <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-800">
          1 yaş altında enerji ihtiyacı bu araçla hesaplanmaz. Büyüme eğrilerini ve güncel EER tablolarını kullanın.
        </p>
      </div>
    )

  const target = r.target!
  const m = macros(target, carb, prot)
  const age = input.age!

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="BMH" value={fmt(r.bmr!)} unit="kcal" />
        <Stat label="Günlük ihtiyaç (TDEE)" value={fmt(r.tdee!)} unit="kcal" />
        <Stat label="Hedef enerji" value={fmt(target)} unit="kcal" main />
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">BKİ</span>
          <span className="font-display text-2xl font-bold">{fmt(r.bmi, 1)} kg/m²</span>
          {r.category && <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${TONE[r.tone!]}`}>{r.category}</span>}
        </div>
        <p className="mt-2 text-sm text-stone-600">
          Sağlıklı kilo aralığı: {fmt(r.idealLo, 1)} – {fmt(r.idealHi, 1)} kg
          {r.weeklyKg != null && r.weeklyKg !== 0 && (
            <> · Tahmini değişim: {fmt(Math.abs(r.weeklyKg), 2)} kg/hafta {r.weeklyKg < 0 ? '(verme)' : '(alma)'}</>
          )}
        </p>
        <p className="mt-1 text-xs text-stone-500">Formül: {FORMULA_NAME[r.formula!]} · Aktivite katsayısı {input.activity}</p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold">Makro dağılımı</h2>
        <Slider label="Karbonhidrat" pct={carb} onChange={(v) => setCarb(Math.min(v, 100 - prot))} g={m.carbG} />
        <Slider label="Protein" pct={prot} onChange={(v) => setProt(Math.min(v, 100 - carb))} g={m.proteinG} />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold">Yağ (kalan) %{m.fatPct}</span>
          <b className="tabular-nums">{fmt(m.fatG)} g</b>
        </div>
        <p className="mt-3 text-xs text-stone-500">Günlük sodyum üst sınırı: {fmt(sodiumLimit(age, target))} mg</p>
      </div>

      {r.warns.length > 0 && (
        <ul className="space-y-2">
          {r.warns.map((w) => (
            <li key={w} className="rounded-xl bg-amber-100 p-3 text-sm text-amber-800">{w}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Slider({ label, pct, onChange, g }: { label: string; pct: number; onChange: (v: number) => void; g: number }) {
  return (
    <div className="mt-3 grid grid-cols-[90px_1fr_90px] items-center gap-3 text-sm">
      <span className="font-semibold">{label} %{pct}</span>
      <input type="range" min={5} max={80} step={5} value={pct} onChange={(e) => onChange(+e.target.value)} className="w-full accent-brand-500" />
      <b className="text-right tabular-nums">{fmt(g)} g</b>
    </div>
  )
}

function Stat({ label, value, unit, main }: { label: string; value: string; unit: string; main?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${main ? 'bg-brand-500 text-white' : 'border border-stone-200 bg-white'}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">
        {value} <span className="text-sm font-semibold opacity-70">{unit}</span>
      </div>
    </div>
  )
}