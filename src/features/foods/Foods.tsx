import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { C, searchFoods, toFoods, type Food, type FoodData } from '../../lib/foods'

const COLS = [
  ['Enerji (kcal)', C.kcal],
  ['Protein (g)', C.protein],
  ['Yağ (g)', C.fat],
  ['Karbonhidrat (g)', C.carb],
  ['Lif (g)', C.fiber],
] as const

const PAGE = 60
const field =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'

export default function Foods() {
  const [data, setData] = useState<FoodData | null>(null)
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<number | null>(null)
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null)
  const [shown, setShown] = useState(PAGE)

  useEffect(() => {
    import('../../data/turkomp.json').then((m) => setData(m.default as unknown as FoodData))
  }, [])

  const foods = useMemo(() => (data ? toFoods(data) : []), [data])

  const rows = useMemo(() => {
    const list = searchFoods(foods, q, group)
    if (!sort) return list
    const { col, dir } = sort
    return [...list].sort((a: Food, b: Food) => {
      const va = a.v[col]
      const vb = b.v[col]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      return (va - vb) * dir
    })
  }, [foods, q, group, sort])

  if (!data) return <p className="text-stone-500">Besin listesi yükleniyor…</p>

  return (
    <>
      <PageTitle title="Besinler" sub="TürKomp verileri, 100 g başına" />
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${field} min-w-60 flex-1`}
          placeholder="Besin, bilimsel veya yöresel isim"
          value={q}
          onChange={(e) => { setQ(e.target.value); setShown(PAGE) }}
        />
        <select
          className={field}
          value={group ?? ''}
          onChange={(e) => { setGroup(e.target.value === '' ? null : +e.target.value); setShown(PAGE) }}
        >
          <option value="">Tüm gruplar</option>
          {data.groups.map((g, i) => (
            <option key={g} value={i}>{g}</option>
          ))}
        </select>
        <span className="self-center text-sm text-stone-500">{rows.length} besin</span>
      </div>
      <div className="overflow-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Besin</th>
              {COLS.map(([label, col]) => (
                <th
                  key={col}
                  className="cursor-pointer whitespace-nowrap px-3 py-2 text-right"
                  onClick={() => setSort(sort?.col === col ? { col, dir: (sort.dir * -1) as 1 | -1 } : { col, dir: -1 })}
                >
                  {label}{sort?.col === col ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((f) => (
              <tr key={f.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-3 py-2 font-semibold">
                  {f.name}
                  <div className="text-xs font-normal text-stone-500">{data.groups[f.groups[0]]}</div>
                </td>
                {COLS.map(([, col]) => (
                  <td key={col} className="px-3 py-2 text-right tabular-nums">
                    {f.v[col] == null ? '—' : f.v[col].toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < rows.length && (
        <div className="mt-4 text-center">
          <button className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold hover:bg-stone-100" onClick={() => setShown(shown + PAGE)}>
            Daha fazla göster
          </button>
        </div>
      )}
      <p className="mt-4 text-xs text-stone-500">
        Veriler TürKomp (T.C. Tarım ve Orman Bakanlığı) dosyasından alınmıştır. Boş hücre, değerin ölçülmediği anlamına gelir.
      </p>
    </>
  )
}