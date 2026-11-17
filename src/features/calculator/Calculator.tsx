import { useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { bmi, bmrMifflin, dailyEnergy, type Sex } from '../../lib/formulas'

const ACTIVITY = [
  ['Hareketsiz', 1.2],
  ['Hafif aktif', 1.375],
  ['Orta aktif', 1.55],
  ['Çok aktif', 1.725],
] as const

const field =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'

export default function Calculator() {
  const [sex, setSex] = useState<Sex>('K')
  const [age, setAge] = useState(30)
  const [heightCm, setHeight] = useState(165)
  const [weightKg, setWeight] = useState(65)
  const [activity, setActivity] = useState(1.375)
  const [goal, setGoal] = useState(0)

  const bmr = bmrMifflin({ sex, age, heightCm, weightKg })
  const energy = dailyEnergy(bmr, activity, goal)
  const index = bmi(weightKg, heightCm)

  return (
    <>
      <PageTitle title="Hesaplama" sub="Mifflin-St Jeor formülüyle günlük enerji ihtiyacı" />
      <div className="grid gap-6 md:grid-cols-[360px_1fr]">
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
          <label className="block text-sm font-semibold">
            Cinsiyet
            <select className={field} value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              <option value="K">Kadın</option>
              <option value="E">Erkek</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Yaş
            <input className={field} type="number" value={age} onChange={(e) => setAge(+e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Boy (cm)
            <input className={field} type="number" value={heightCm} onChange={(e) => setHeight(+e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Kilo (kg)
            <input className={field} type="number" value={weightKg} onChange={(e) => setWeight(+e.target.value)} />
          </label>
          <label className="block text-sm font-semibold">
            Fiziksel aktivite
            <select className={field} value={activity} onChange={(e) => setActivity(+e.target.value)}>
              {ACTIVITY.map(([n, v]) => (
                <option key={v} value={v}>{n} ({v})</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Hedef (kcal fark)
            <select className={field} value={goal} onChange={(e) => setGoal(+e.target.value)}>
              <option value={-500}>Kilo ver (−500)</option>
              <option value={0}>Kiloyu koru</option>
              <option value={500}>Kilo al (+500)</option>
            </select>
          </label>
        </div>
        <div className="grid h-fit grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="BMH" value={Math.round(bmr)} unit="kcal" />
          <Stat label="Günlük ihtiyaç" value={Math.round(energy)} unit="kcal" main />
          <Stat label="BKİ" value={Math.round(index * 10) / 10} unit="" />
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, unit, main }: { label: string; value: number; unit: string; main?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${main ? 'bg-brand-500 text-white' : 'bg-white border border-stone-200'}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">
        {value} <span className="text-sm font-semibold opacity-70">{unit}</span>
      </div>
    </div>
  )
}