import type { Profile } from './profile'

const field =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'

export default function ProfileFields({ value, onChange, hideFormula }: { value: Profile; onChange: (p: Profile) => void; hideFormula?: boolean }) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onChange({ ...value, [k]: v })
  const num = (k: 'age' | 'h' | 'w') => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, e.target.value.replace(/[^0-9.,]/g, ''))

  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 block text-sm font-semibold">
        Cinsiyet
        <div className="mt-1 flex overflow-hidden rounded-lg border border-stone-300">
          {(['K', 'E'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('sex', s)}
              className={`flex-1 py-2 font-semibold ${value.sex === s ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}
            >
              {s === 'K' ? 'Kadın' : 'Erkek'}
            </button>
          ))}
        </div>
      </label>
      <label className="block text-sm font-semibold">
        Yaş
        <input className={field} inputMode="decimal" maxLength={3} placeholder="Yazın" value={value.age} onChange={num('age')} />
      </label>
      <label className="block text-sm font-semibold">
        Boy (cm)
        <input className={field} inputMode="numeric" maxLength={3} placeholder="Yazın" value={value.h} onChange={num('h')} />
      </label>
      <label className="block text-sm font-semibold">
        Kilo (kg)
        <input className={field} inputMode="decimal" maxLength={5} placeholder="Yazın" value={value.w} onChange={num('w')} />
      </label>
      <label className="block text-sm font-semibold">
        Fiziksel aktivite
        <select className={field} value={value.act} onChange={(e) => set('act', e.target.value)}>
          <option value="1.2">Hareketsiz (1,2)</option>
          <option value="1.375">Hafif aktif (1,375)</option>
          <option value="1.55">Orta aktif (1,55)</option>
          <option value="1.725">Çok aktif (1,725)</option>
          <option value="1.9">Aşırı aktif (1,9)</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Hedef
        <select className={field} value={value.goal} onChange={(e) => set('goal', e.target.value)}>
          <option value="0">Kiloyu koru</option>
          <option value="-250">Yavaş ver (−250 kcal)</option>
          <option value="-500">Kilo ver (−500 kcal)</option>
          <option value="-750">Hızlı ver (−750 kcal)</option>
          <option value="250">Yavaş al (+250 kcal)</option>
          <option value="500">Kilo al (+500 kcal)</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Fizyolojik durum
        <select className={field} value={value.phys} onChange={(e) => set('phys', e.target.value as Profile['phys'])}>
          <option value="none">Yok</option>
          <option value="g1">Gebelik, 1. trimester</option>
          <option value="g2">Gebelik, 2. trimester</option>
          <option value="g3">Gebelik, 3. trimester</option>
          <option value="emz">Emzirme</option>
        </select>
      </label>
      {!hideFormula && (
      <label className="col-span-2 block text-sm font-semibold">
        BMH formülü
        <select className={field} value={value.formula} onChange={(e) => set('formula', e.target.value as Profile['formula'])}>
          <option value="auto">Otomatik (yetişkin: Mifflin-St Jeor, çocuk: Schofield)</option>
          <option value="mifflin">Mifflin-St Jeor</option>
          <option value="harris">Harris-Benedict (revize)</option>
          <option value="schofield">Schofield (FAO/WHO)</option>
        </select>
      </label>
      )}
    </div>
  )
}