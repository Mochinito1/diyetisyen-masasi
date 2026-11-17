import { useMemo, useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { btn, field } from '../../components/ui/styles'
import { fold, foodMatch, type Food } from '../../lib/foods'
import { fmtVal, parseNum } from '../../lib/format'
import { foodUnits, makeItem } from '../../lib/menu'
import { synStartsWith } from '../../lib/synonyms'
import { useFoodData } from '../../lib/useFoodData'
import { useClients } from '../clients/useClients'
import { useSelectedClient } from '../clients/useSelectedClient'
import FoodDetail from './FoodDetail'
import ReasonChips from './ReasonChips'
import { useEvaluation } from './useEvaluation'
import { useRemovedFoods } from './useRemovedFoods'

type Status = 'visible' | 'ok' | 'all' | 'hidden'
const DEFAULT_COLS = ['Enerji (kcal)', 'Protein', 'Karbonhidrat', 'Yağ, toplam', 'Lif, toplam diyet', 'Sodyum, Na', 'Kalsiyum, Ca', 'Demir, Fe']
const PRESETS: [string, string[]][] = [
  ['Makro', ['Enerji (kcal)', 'Protein', 'Karbonhidrat', 'Yağ, toplam', 'Lif, toplam diyet']],
  ['Mineraller', ['Sodyum, Na', 'Potasyum, K', 'Kalsiyum, Ca', 'Demir, Fe', 'Fosfor, P', 'Magnezyum, Mg', 'Çinko, Zn']],
  ['Vitaminler', ['A vitamini', 'C vitamini', 'D vitamini, IU', 'E vitamini', 'B-12 vitamini', 'Folat, gıda']],
  ['Yağ profili', ['Yağ, toplam', 'Yağ asitleri, toplam doymuş', 'Yağ asitleri, toplam tekli doymamış', 'Yağ asitleri, toplam çoklu doymamış', 'Kolesterol']],
  ['Şekerler', ['Karbonhidrat', 'Glukoz', 'Fruktoz', 'Sakaroz', 'Laktoz', 'Nişasta']],
]
const CATS = ['Temel', 'Mineraller', 'Vitaminler ve karotenoidler', 'Şekerler ve tatlandırıcılar', 'Yağ asitleri', 'Amino asitler']
const PAGE = 80

export default function Foods() {
  const food = useFoodData()
  const { clients, upsert } = useClients()
  const { client, choose } = useSelectedClient(clients)
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)

  const [q, setQ] = useState('')
  const [group, setGroup] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('visible')
  const [portionG, setPortionG] = useState('100')
  const [cols, setCols] = useState<string[]>(DEFAULT_COLS)
  const [colsOpen, setColsOpen] = useState(false)
  const [rn, setRn] = useState('')
  const [rmin, setRmin] = useState('')
  const [rmax, setRmax] = useState('')
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: 'name', d: 1 })
  const [shown, setShown] = useState(PAGE)
  const [detail, setDetail] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const portion = parseNum(portionG) ?? 100
  const k = portion / 100
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1800) }

  const rows = useMemo(() => {
    if (!food || !evalr) return []
    const ci = new Map(food.data.comps.map((c, i) => [c[0], i]))
    const rnI = rn ? ci.get(rn) : undefined
    const lo = parseNum(rmin), hi = parseNum(rmax)
    let list = food.foods.map((f) => ({ f, e: evalr.map.get(f.code)! })).filter(({ f, e }) => {
      if (status === 'visible' && e.st === 'hide') return false
      if (status === 'ok' && e.st !== 'ok') return false
      if (status === 'hidden' && e.st !== 'hide') return false
      if (group !== null && !f.groups.includes(group)) return false
      if (q.trim() && !foodMatch(f, q)) return false
      if (rnI != null && (lo != null || hi != null)) {
        const v = f.v[rnI]
        if (v == null) return false
        const sv = v * k
        if (lo != null && sv < lo) return false
        if (hi != null && sv > hi) return false
      }
      return true
    })
    if (sort.k === 'name') {
      const fq = fold(q).trim()
      const rank = (f: Food) => {
        if (!fq) return 0
        const n = fold(f.name)
        const w = n.split(/[\s,()/-]+/).filter(Boolean)
        if (w[0] === fq) return 0
        if (synStartsWith(n, q)) return 0.5
        if (n.startsWith(fq)) return 1
        if (w.includes(fq)) return 2
        if (w.some((x) => x.startsWith(fq))) return 3
        return 4
      }
      list = list.sort((a, b) => rank(a.f) - rank(b.f) || a.f.name.localeCompare(b.f.name, 'tr') * sort.d)
    } else {
      const i = ci.get(sort.k)!
      list = list.sort((a, b) => {
        const va = a.f.v[i], vb = b.f.v[i]
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        return (va - vb) * sort.d
      })
    }
    return list
  }, [food, evalr, q, group, status, k, rn, rmin, rmax, sort])

  if (!food || !evalr) return <p className="text-stone-500">Besin listesi yükleniyor…</p>

  const colIdx = cols.map((n) => food.data.comps.findIndex((c) => c[0] === n)).filter((i) => i >= 0)
  const comps = food.data.comps
  const counts = { ok: 0, warn: 0, hide: 0 }
  evalr.map.forEach((e) => counts[e.st]++)

  const addToMenu = (f: Food, item = makeItem(f, food.groups, 1, foodUnits(f, food.groups)[0].u, 'Öğle')) => {
    if (!client) return
    upsert({ ...client, menu: [...client.menu, item], updated: Date.now() })
    flash(`Menüye eklendi: ${f.name.replace(/\s*\(.*$/, '')}`)
  }

  const copyList = async () => {
    const head = ['Besin', 'Grup', 'Durum', ...colIdx.map((i) => `${comps[i][0]} (${comps[i][1]})`)]
    const lines = [head.join('\t')]
    rows.forEach(({ f, e }) => lines.push([
      f.name, f.groups.map((g) => food.groups[g]).join(' / '), e.st === 'hide' ? 'Gizli' : e.st === 'warn' ? 'Uyarılı' : 'Uygun',
      ...colIdx.map((i) => (f.v[i] == null ? '' : String(+(f.v[i] * k).toFixed(3)).replace('.', ','))),
    ].join('\t')))
    try { await navigator.clipboard.writeText(lines.join('\n')); flash('Panoya kopyalandı') } catch { flash('Kopyalanamadı') }
  }

  const th = (key: string, label: string, unit = '') => (
    <th key={key} onClick={() => setSort(sort.k === key ? { k: key, d: (sort.d * -1) as 1 | -1 } : { k: key, d: key === 'name' ? 1 : -1 })}
      className={`cursor-pointer whitespace-nowrap px-3 py-2 ${key === 'name' ? 'sticky left-0 z-10 min-w-40 bg-stone-100 sm:min-w-60 text-left' : 'text-right'} ${sort.k === key ? 'text-brand-500' : ''}`}>
      {label} {unit && <span className="font-medium">{unit}</span>} {sort.k === key && (sort.d > 0 ? '▲' : '▼')}
    </th>
  )

  const detailFood = detail ? food.byCode.get(detail) : null

  return (
    <>
      <PageTitle title="Besin listesi" sub="TürKomp verileri. Danışan seçiliyse hastalık, diyet ve yaşa göre süzülür." />

      <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-stone-500">Danışan
            <select className={`${field} mt-1 block`} value={client?.id ?? ''} onChange={(e) => choose(e.target.value)} disabled={clients.length === 0}>
              {clients.length === 0 && <option value="">Danışan yok</option>}
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          {client && (
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              {evalr.conds.length === 0 && evalr.age == null && <span className="text-stone-500">Hastalık veya yaş bilgisi girilmemiş, süzme uygulanmıyor.</span>}
              {evalr.conds.map((c) => <span key={c.id} className="rounded-full bg-stone-100 px-2.5 py-1">{c.short}</span>)}
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{counts.ok} uygun</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{counts.warn} uyarılı</span>
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-800">{counts.hide} gizli</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1 text-xs font-bold uppercase tracking-wider text-stone-500">Ara
            <input className={`${field} mt-1 w-full text-sm font-normal normal-case text-stone-900`} placeholder="Besin, bilimsel veya yöresel isim" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} />
          </label>
          <label className="max-w-full text-xs font-bold uppercase tracking-wider text-stone-500">Besin grubu
            <select className={`${field} mt-1 block w-full max-w-full text-sm font-normal normal-case text-stone-900 sm:w-auto`} value={group ?? ''} onChange={(e) => { setGroup(e.target.value === '' ? null : +e.target.value); setShown(PAGE) }}>
              <option value="">Tüm gruplar</option>
              {food.groups.map((g, i) => <option key={g} value={i}>{g}</option>)}
            </select>
          </label>
          <label className="max-w-full text-xs font-bold uppercase tracking-wider text-stone-500">Gösterim
            <select className={`${field} mt-1 block w-full max-w-full text-sm font-normal normal-case text-stone-900 sm:w-auto`} value={status} onChange={(e) => { setStatus(e.target.value as Status); setShown(PAGE) }}>
              <option value="visible">Uygun ve uyarılı</option>
              <option value="ok">Yalnızca uyarısız</option>
              <option value="all">Gizlenenler dahil tümü</option>
              <option value="hidden">Yalnızca gizlenenler</option>
            </select>
          </label>
          <label className="w-28 text-xs font-bold uppercase tracking-wider text-stone-500">Miktar (g)
            <input className={`${field} mt-1 w-full text-sm font-normal text-stone-900`} inputMode="numeric" value={portionG} onChange={(e) => setPortionG(e.target.value.replace(/[^0-9.,]/g, ''))} />
          </label>
          <button className={btn} onClick={() => setColsOpen(!colsOpen)} aria-expanded={colsOpen}>Değerleri seç</button>
          <button className={btn} onClick={copyList}>Listeyi kopyala</button>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="max-w-full text-xs font-bold uppercase tracking-wider text-stone-500">Değer filtresi
            <select className={`${field} mt-1 block w-full max-w-full text-sm font-normal normal-case text-stone-900 sm:w-auto`} value={rn} onChange={(e) => { setRn(e.target.value); setShown(PAGE) }}>
              <option value="">Yok</option>
              {CATS.map((cat) => <optgroup key={cat} label={cat}>{comps.filter((c) => c[2] === cat).map((c) => <option key={c[0]} value={c[0]}>{c[0]} ({c[1]})</option>)}</optgroup>)}
            </select>
          </label>
          <label className="w-24 text-xs font-bold uppercase tracking-wider text-stone-500">En az<input className={`${field} mt-1 w-full text-sm font-normal text-stone-900`} inputMode="decimal" value={rmin} onChange={(e) => setRmin(e.target.value)} /></label>
          <label className="w-24 text-xs font-bold uppercase tracking-wider text-stone-500">En çok<input className={`${field} mt-1 w-full text-sm font-normal text-stone-900`} inputMode="decimal" value={rmax} onChange={(e) => setRmax(e.target.value)} /></label>
          <span className="ml-auto self-center text-sm text-stone-500">{rows.length} besin listeleniyor</span>
        </div>

        {colsOpen && (
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Hazır setler</span>
              {PRESETS.map(([n, list]) => <button key={n} className={btn} onClick={() => setCols(list)}>{n}</button>)}
              <button className={btn} onClick={() => setCols([])}>Temizle</button>
            </div>
            {CATS.map((cat) => (
              <div key={cat}>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-stone-500">{cat}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {comps.filter((c) => c[2] === cat).map((c) => (
                    <label key={c[0]} className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm">
                      <input type="checkbox" className="accent-brand-500" checked={cols.includes(c[0])} onChange={(e) => setCols(e.target.checked ? [...cols, c[0]] : cols.filter((x) => x !== c[0]))} />
                      {c[0]} <span className="text-stone-500">{c[1]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 max-h-[72vh] overflow-auto rounded-xl border border-stone-200">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20 bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                {th('name', 'Besin')}
                {colIdx.map((i) => th(comps[i][0], comps[i][0], comps[i][1]))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map(({ f, e }) => (
                <tr key={f.id} className={`hover:bg-stone-50 ${e.st === 'hide' ? 'opacity-55' : ''}`}>
                  <td className="sticky left-0 z-10 min-w-40 max-w-56 sm:min-w-60 sm:max-w-80 border-b border-stone-100 bg-white px-3 py-2">
                    <button className="text-left font-bold hover:text-brand-500 hover:underline" onClick={() => setDetail(f.code)}>{f.name}</button>
                    <div className="text-xs text-stone-500">{f.groups.map((g) => food.groups[g]).join(' · ')}</div>
                    <ReasonChips ev={e} max={3} />
                  </td>
                  {colIdx.map((i) => <td key={i} className="whitespace-nowrap border-b border-stone-100 px-3 py-2 text-right tabular-nums">{fmtVal(f.v[i] == null ? null : f.v[i] * k)}</td>)}
                  <td className="whitespace-nowrap border-b border-stone-100 px-3 py-2 text-right">
                    {client && <button className="mr-1 h-7 w-7 rounded-full border border-stone-300 font-bold text-brand-500 hover:bg-brand-500 hover:text-white" title="Menüye ekle" aria-label="Menüye ekle" onClick={() => addToMenu(f)}>+</button>}
                    {removed.set.has(f.code)
                      ? <button className="h-7 w-7 rounded-full border border-stone-300 font-bold text-brand-500" title="Geri al" aria-label="Geri al" onClick={() => removed.restore(f.code)}>↺</button>
                      : <button className="h-7 w-7 rounded-full border border-stone-300 font-bold text-stone-500 hover:bg-red-100 hover:text-red-800" title="Listeden kaldır" aria-label="Listeden kaldır" onClick={() => removed.remove(f.code)}>×</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={colIdx.length + 2} className="p-9 text-center text-stone-500">Bu filtrelerle eşleşen besin yok.</td></tr>}
            </tbody>
          </table>
        </div>
        {rows.length > shown && (
          <div className="mt-3 text-center"><button className={btn} onClick={() => setShown(shown + PAGE)}>Daha fazla göster ({rows.length - shown} besin daha)</button></div>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Veriler TürKomp (T.C. Tarım ve Orman Bakanlığı) dosyasından alınmıştır. Boş hücre, o besin için değer ölçülmediği anlamına gelir. Gluten, alerjen ve pürin bilgisi dosyada bulunmadığı için ilgili filtreler besin adı ve grubuna göre çalışır, kesin sonuç için ürün etiketi kontrol edilmelidir.
        </p>
      </div>

      {detailFood && (
        <FoodDetail food={food} f={detailFood} ev={evalr.map.get(detailFood.code)!} portionG={portion} canAdd={!!client} onClose={() => setDetail(null)}
          onAdd={(item) => { addToMenu(detailFood, item); setDetail(null) }} />
      )}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 shadow-lg">{toast}</div>}
    </>
  )
}