import { useMemo, useState } from 'react'
import PageTitle from '../../components/ui/PageTitle'
import { btn, field } from '../../components/ui/styles'
import { fold, foodMatch, type Food } from '../../lib/foods'
import { fmt, fmtVal, parseNum } from '../../lib/format'
import { MEALS, foodUnits, makeItem, shortName, type Meal } from '../../lib/menu'
import { synStartsWith } from '../../lib/synonyms'
import { useFoodData } from '../../lib/useFoodData'
import { useClients } from '../clients/useClients'
import { useSelectedClient } from '../clients/useSelectedClient'
import FoodDetail from './FoodDetail'
import ReasonChips from './ReasonChips'
import { useEvaluation } from './useEvaluation'
import { useRemovedFoods } from './useRemovedFoods'

type Status = 'visible' | 'ok' | 'all' | 'hidden' | 'removed'
/** Tablo yatay kaydırma gerektirmesin diye en fazla bu kadar değer sütunu gösterilir */
const MAX_COLS = 7
const DEFAULT_COLS = ['Enerji (kcal)', 'Protein', 'Karbonhidrat', 'Yağ, toplam', 'Lif, toplam diyet', 'Sodyum, Na', 'Kalsiyum, Ca']
const PRESETS: [string, string[]][] = [
  ['Makro', ['Enerji (kcal)', 'Protein', 'Karbonhidrat', 'Yağ, toplam', 'Lif, toplam diyet']],
  ['Mineraller', ['Sodyum, Na', 'Potasyum, K', 'Kalsiyum, Ca', 'Demir, Fe', 'Fosfor, P', 'Magnezyum, Mg', 'Çinko, Zn']],
  ['Vitaminler', ['A vitamini', 'C vitamini', 'D vitamini, IU', 'E vitamini', 'B-12 vitamini', 'Folat, gıda']],
  ['Yağ profili', ['Yağ, toplam', 'Yağ asitleri, toplam doymuş', 'Yağ asitleri, toplam tekli doymamış', 'Yağ asitleri, toplam çoklu doymamış', 'Kolesterol']],
  ['Şekerler', ['Karbonhidrat', 'Glukoz', 'Fruktoz', 'Sakaroz', 'Laktoz', 'Nişasta']],
]
const CATS = ['Temel', 'Mineraller', 'Vitaminler ve karotenoidler', 'Şekerler ve tatlandırıcılar', 'Yağ asitleri', 'Amino asitler']
const SORTS: [string, string][] = [['name', 'Ada göre (A-Z)'], ['Enerji (kcal)', 'Enerji (çoktan aza)'], ['Protein', 'Protein (çoktan aza)'], ['Karbonhidrat', 'Karbonhidrat (çoktan aza)'], ['Yağ, toplam', 'Yağ (çoktan aza)'], ['Lif, toplam diyet', 'Lif (çoktan aza)']]
const PAGE = 48
const lbl = 'text-[11px] font-bold uppercase tracking-wider text-stone-500'

export default function Foods() {
  const food = useFoodData()
  const { clients, upsert } = useClients()
  const { client, choose } = useSelectedClient(clients)
  const removed = useRemovedFoods()
  const evalr = useEvaluation(food, client, removed.set)

  const [q, setQ] = useState('')
  const [group, setGroup] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('visible')
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [adv, setAdv] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [portionG, setPortionG] = useState('100')
  const [meal, setMeal] = useState<Meal>('Öğle')
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
      if (status === 'removed') { if (!removed.set.has(f.code)) return false }
      else {
        if (status === 'visible' && e.st === 'hide') return false
        if (status === 'ok' && e.st !== 'ok') return false
        if (status === 'hidden' && e.st !== 'hide') return false
      }
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
  }, [food, evalr, q, group, status, k, rn, rmin, rmax, sort, removed.set])

  if (!food || !evalr) return <p className="text-stone-500">Besin listesi yükleniyor…</p>

  const comps = food.data.comps
  const ci = (n: string) => comps.findIndex((c) => c[0] === n)
  const colIdx = cols.map(ci).filter((i) => i >= 0)
  const I = { kcal: ci('Enerji (kcal)'), p: ci('Protein'), c: ci('Karbonhidrat'), f: ci('Yağ, toplam') }
  const counts = { ok: 0, warn: 0, hide: 0 }
  evalr.map.forEach((e) => counts[e.st]++)

  const addToMenu = (f: Food, item = makeItem(f, food.groups, 1, foodUnits(f, food.groups)[0].u, meal)) => {
    if (!client) return
    upsert({ ...client, menu: [...client.menu, item], updated: Date.now() })
    flash(`${meal} öğününe eklendi: ${shortName(f.name)}`)
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

  // Dar ekranlarda ilk 2 değer, geniş ekranlarda 4, masaüstünde tümü görünür (yatay kaydırma olmaz)
  const colShow = (n: number) => (n < 2 ? '' : n < 4 ? 'hidden sm:table-cell' : 'hidden lg:table-cell')
  const th = (key: string, label: string, unit = '', n = 0) => (
    <th key={key} onClick={() => setSort(sort.k === key ? { k: key, d: (sort.d * -1) as 1 | -1 } : { k: key, d: key === 'name' ? 1 : -1 })}
      className={`cursor-pointer select-none px-2 py-2.5 align-bottom text-[11px] leading-tight ${key === 'name' ? 'w-[46%] text-left sm:w-[34%]' : `${colShow(n)} text-right`} ${sort.k === key ? 'text-brand-500' : ''}`}>
      <span className="break-words">{label.replace(/, toplam diyet| \(kcal\)|, toplam/, '').replace('Karbonhidrat', 'Karb.').replace('Kalsiyum', 'Kalsiyum')}</span> {unit && <span className="font-medium normal-case">({unit})</span>} {sort.k === key && (sort.d > 0 ? '▲' : '▼')}
    </th>
  )

  const detailFood = detail ? food.byCode.get(detail) : null
  const STATUSES: [Status, string][] = [['visible', 'Uygun ve uyarılı'], ['ok', 'Yalnızca uyarısız'], ['all', 'Tümü'], ['hidden', 'Gizlenenler'], ...(removed.canEdit ? [['removed', `Kaldırılanlar (${removed.set.size})`] as [Status, string]] : [])]

  /** Yönetici: besini listeden kaldırır / geri alır. Diyetisyen bu düğmeleri görmez. */
  const adminBtn = (f: Food) => !removed.canEdit ? null : removed.set.has(f.code)
    ? <button className="h-8 rounded-full border border-brand-500 px-3 text-xs font-bold text-brand-500 hover:bg-brand-50" title="Listeye geri al" onClick={() => { removed.restore(f.code); flash('Besin geri alındı') }}>↺ Geri al</button>
    : <button className="h-8 w-8 rounded-full border border-stone-300 font-bold text-stone-500 hover:bg-red-100 hover:text-red-800" title="Listeden kaldır (yalnızca yönetici)" aria-label="Listeden kaldır" onClick={() => confirm(`“${shortName(f.name)}” tüm diyetisyenler için listeden kaldırılsın mı? Daha sonra geri alabilirsiniz.`) && removed.remove(f.code)}>×</button>

  const sideLabel = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-500'
  const sideField = `${field} w-full text-sm`
  const activeFilters = (group !== null ? 1 : 0) + (status !== 'visible' ? 1 : 0) + (rn ? 1 : 0)

  const sidebar = (
    <div className="space-y-5">
      <div>
        <label className={sideLabel} htmlFor="f-client">Danışan</label>
        <select id="f-client" className={sideField} value={client?.id ?? ''} onChange={(e) => choose(e.target.value)} disabled={clients.length === 0}>
          {clients.length === 0 && <option value="">Danışan yok</option>}
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {client && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
            {evalr.conds.map((c) => <span key={c.id} className="rounded-full bg-stone-100 px-2 py-0.5">{c.short}</span>)}
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{counts.ok} uygun</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{counts.warn} uyarılı</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">{counts.hide} gizli</span>
          </div>
        )}
        {client && evalr.conds.length === 0 && evalr.age == null && <p className="mt-2 text-xs text-stone-500">Hastalık veya yaş bilgisi yok, süzme uygulanmıyor.</p>}
      </div>

      {client && (
        <div>
          <label className={sideLabel} htmlFor="f-meal">Menüye eklenecek öğün</label>
          <select id="f-meal" className={sideField} value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
            {MEALS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div>
        <span className={sideLabel}>Gösterim</span>
        <div className="flex flex-col gap-1" role="group" aria-label="Gösterim">
          {STATUSES.map(([s, label]) => (
            <button key={s} aria-pressed={status === s} onClick={() => { setStatus(s); setShown(PAGE) }}
              className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${status === s ? 'bg-brand-500 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={sideLabel} htmlFor="f-group">Besin grubu</label>
        <select id="f-group" className={sideField} value={group ?? ''} onChange={(e) => { setGroup(e.target.value === '' ? null : +e.target.value); setShown(PAGE) }}>
          <option value="">Tüm gruplar</option>
          {food.groups.map((g, i) => <option key={g} value={i}>{g}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={sideLabel} htmlFor="f-portion">Miktar (g)</label>
          <input id="f-portion" className={sideField} inputMode="numeric" value={portionG} onChange={(e) => setPortionG(e.target.value.replace(/[^0-9.,]/g, ''))} />
        </div>
        <div>
          <label className={sideLabel} htmlFor="f-sort">Sırala</label>
          <select id="f-sort" className={sideField} value={sort.k} onChange={(e) => setSort({ k: e.target.value, d: e.target.value === 'name' ? 1 : -1 })}>
            {SORTS.map(([key, label]) => <option key={key} value={key}>{label.replace(' (çoktan aza)', ' ↓').replace(' (A-Z)', '')}</option>)}
          </select>
        </div>
      </div>

      <div>
        <button className="flex w-full items-center justify-between rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold hover:bg-stone-100" onClick={() => setAdv(!adv)} aria-expanded={adv}>
          Değer süzgeci <span aria-hidden="true">{adv ? '▴' : '▾'}</span>
        </button>
        {adv && (
          <div className="mt-2 space-y-2 rounded-lg bg-stone-50 p-3">
            <select className={sideField} aria-label="Değer" value={rn} onChange={(e) => { setRn(e.target.value); setShown(PAGE) }}>
              <option value="">Değer seçin</option>
              {CATS.map((cat) => <optgroup key={cat} label={cat}>{comps.filter((c) => c[2] === cat).map((c) => <option key={c[0]} value={c[0]}>{c[0]} ({c[1]})</option>)}</optgroup>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className={sideField} inputMode="decimal" placeholder="En az" aria-label="En az" value={rmin} onChange={(e) => setRmin(e.target.value)} />
              <input className={sideField} inputMode="decimal" placeholder="En çok" aria-label="En çok" value={rmax} onChange={(e) => setRmax(e.target.value)} />
            </div>
            <p className="text-xs text-stone-500">{fmt(portion)} g için hesaplanır.</p>
          </div>
        )}
      </div>

      {(activeFilters > 0 || q) && (
        <button className="w-full text-sm font-semibold text-brand-500 hover:underline" onClick={() => { setQ(''); setGroup(null); setStatus('visible'); setRn(''); setRmin(''); setRmax(''); setShown(PAGE) }}>Süzgeçleri temizle</button>
      )}
    </div>
  )

  return (
    <>
      <PageTitle title="Besin listesi" sub="TürKomp verileri. Danışan seçiliyse hastalık, diyet ve yaşa göre süzülür." />

      <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sol: süzgeçler (dar ekranda açılır panel) */}
        <aside className="xl:sticky xl:top-[112px]">
          <button className="mb-3 flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold xl:hidden" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>
            <span>Süzgeçler ve danışan{activeFilters > 0 ? ` (${activeFilters})` : ''}</span><span aria-hidden="true">{filtersOpen ? '▴' : '▾'}</span>
          </button>
          <div className={`${filtersOpen ? 'block' : 'hidden'} rounded-2xl border border-stone-200 bg-white p-4 xl:block xl:max-h-[calc(100vh-128px)] xl:overflow-y-auto`}>{sidebar}</div>
        </aside>

        {/* Sağ: arama ve sonuçlar */}
        <div className="min-w-0">
          <div className="relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <input className={`${field} w-full rounded-2xl py-3.5 pl-12 text-base shadow-sm`} aria-label="Besin ara" placeholder="Besin, bilimsel veya yöresel isim ara…" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-stone-500"><b className="text-stone-800">{rows.length}</b> besin</span>
            {removed.canEdit && status === 'removed' && removed.set.size > 0 && (
              <button className={btn} onClick={() => confirm('Kaldırılan tüm besinler geri alınsın mı?') && removed.restoreAll()}>Tümünü geri al</button>
            )}
            <span className="ml-auto flex flex-wrap items-center gap-2">
              {view === 'table' && <button className={btn} onClick={() => setColsOpen(!colsOpen)} aria-expanded={colsOpen}>Değerleri seç</button>}
              <button className={btn} onClick={copyList}>Kopyala</button>
              <div className="flex overflow-hidden rounded-lg border border-stone-300 text-sm font-semibold" role="tablist" aria-label="Görünüm">
                {([['cards', 'Kartlar'], ['table', 'Tablo']] as const).map(([v, label]) => (
                  <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`px-3 py-1.5 ${view === v ? 'bg-brand-500 text-white' : 'bg-white text-stone-600'}`}>{label}</button>
                ))}
              </div>
            </span>
          </div>

          {view === 'table' && colsOpen && (
            <div className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={lbl}>Hazır setler</span>
                <span className="text-xs text-stone-500">(en fazla {MAX_COLS} değer · {cols.length} seçili)</span>
                {PRESETS.map(([n, list]) => <button key={n} className={btn} onClick={() => setCols(list.slice(0, MAX_COLS))}>{n}</button>)}
                <button className={btn} onClick={() => setCols([])}>Temizle</button>
              </div>
              {CATS.map((cat) => (
                <div key={cat}>
                  <div className={`mt-3 ${lbl}`}>{cat}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {comps.filter((c) => c[2] === cat).map((c) => (
                      <label key={c[0]} className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm">
                        <input type="checkbox" className="accent-brand-500" checked={cols.includes(c[0])} disabled={!cols.includes(c[0]) && cols.length >= MAX_COLS} onChange={(e) => setCols(e.target.checked ? [...cols, c[0]].slice(0, MAX_COLS) : cols.filter((x) => x !== c[0]))} />
                        {c[0]} <span className="text-stone-500">{c[1]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
              {status === 'removed' ? 'Kaldırılmış besin yok.' : 'Bu filtrelerle eşleşen besin yok.'}
            </div>
          ) : view === 'cards' ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {rows.slice(0, shown).map(({ f, e }) => {
                const isRemoved = removed.set.has(f.code)
                const val = (i: number) => (i >= 0 && f.v[i] != null ? f.v[i]! * k : null)
                return (
                  <article key={f.id} className={`group flex flex-col rounded-2xl border bg-white p-4 transition hover:border-brand-500 hover:shadow-md ${isRemoved ? 'border-dashed border-red-300 opacity-70' : e.st === 'hide' ? 'border-stone-200 opacity-60' : 'border-stone-200'}`}>
                    <div className="flex items-start gap-2">
                      <button className="min-w-0 flex-1 text-left" onClick={() => setDetail(f.code)} title="Ayrıntıları aç">
                        <h3 className="font-display text-[15px] font-bold leading-snug group-hover:text-brand-500">{shortName(f.name)}</h3>
                        <div className="mt-0.5 truncate text-xs text-stone-500">{f.groups.map((g) => food.groups[g]).join(' · ')}</div>
                      </button>
                      <div className="text-right">
                        <div className="font-display text-2xl font-bold leading-none tabular-nums">{fmtVal(val(I.kcal))}</div>
                        <div className="text-[11px] font-semibold text-stone-500">kcal</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-stone-600">
                      {([['P', I.p, 'bg-brand-500'], ['K', I.c, 'bg-amber-700/60'], ['Y', I.f, 'bg-stone-500']] as const).map(([n, i, dot]) => (
                        <span key={n} className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 tabular-nums">
                          <i className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />{n} <b>{fmtVal(val(i))}</b> g
                        </span>
                      ))}
                      <span className="ml-auto text-[11px] text-stone-400">{fmt(portion)} g</span>
                    </div>
                    <ReasonChips ev={e} max={2} />
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      {client && !isRemoved && <button className="flex-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:brightness-110" onClick={() => addToMenu(f)}>+ {meal}</button>}
                      {!client && <button className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold hover:bg-stone-100" onClick={() => setDetail(f.code)}>Ayrıntı</button>}
                      {adminBtn(f)}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
                <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    {th('name', 'Besin')}
                    {colIdx.map((i, n) => th(comps[i][0], comps[i][0], comps[i][1], n))}
                    <th className="w-24 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, shown).map(({ f, e }) => (
                    <tr key={f.id} className={`hover:bg-stone-50 ${e.st === 'hide' ? 'opacity-55' : ''}`}>
                      <td className="border-b border-stone-100 bg-white px-2 py-2 sm:px-3">
                        <button className="text-left font-bold leading-snug hover:text-brand-500 hover:underline" onClick={() => setDetail(f.code)}>{shortName(f.name)}</button>
                        <div className="text-xs text-stone-500">{f.groups.map((g) => food.groups[g]).join(' · ')}</div>
                        <ReasonChips ev={e} max={3} />
                      </td>
                      {colIdx.map((i, n) => <td key={i} className={`border-b border-stone-100 px-2 py-2 text-right tabular-nums ${colShow(n)}`}>{fmtVal(f.v[i] == null ? null : f.v[i] * k)}</td>)}
                      <td className="whitespace-nowrap border-b border-stone-100 px-2 py-2 text-right">
                        {client && !removed.set.has(f.code) && <button className="mr-1 h-8 w-8 rounded-full border border-stone-300 font-bold text-brand-500 hover:bg-brand-500 hover:text-white" title={`${meal} öğününe ekle`} aria-label="Menüye ekle" onClick={() => addToMenu(f)}>+</button>}
                        {adminBtn(f)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > shown && (
            <div className="mt-4 text-center"><button className={btn} onClick={() => setShown(shown + PAGE)}>Daha fazla göster ({rows.length - shown} besin daha)</button></div>
          )}
          <p className="mt-4 text-xs text-stone-500">
            Veriler TürKomp (T.C. Tarım ve Orman Bakanlığı) dosyasından alınmıştır. Boş değer, o besin için ölçülmediği anlamına gelir. Gluten, alerjen ve pürin bilgisi dosyada bulunmadığı için ilgili filtreler besin adı ve grubuna göre çalışır, kesin sonuç için ürün etiketi kontrol edilmelidir.
          </p>
        </div>
      </div>

      {detailFood && (
        <FoodDetail food={food} f={detailFood} ev={evalr.map.get(detailFood.code)!} portionG={portion} canAdd={!!client} onClose={() => setDetail(null)}
          onAdd={(item) => { addToMenu(detailFood, item); setDetail(null) }} />
      )}
      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 shadow-lg">{toast}</div>}
    </>
  )
}