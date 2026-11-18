import { useState } from 'react'
import { C, type Food } from '../../lib/foods'
import { fmt, parseNum } from '../../lib/format'
import { macros, type CalcResult } from '../../lib/formulas'
import {
  MEALS, MICRO, foodUnits, makeItem, menuTSV, portion, searchForMenu, shortName, totals, warnList,
  type Meal, type MenuItem,
} from '../../lib/menu'
import type { useFoodData } from '../../lib/useFoodData'
import type { Evaluation } from '../../lib/rules'
import ReasonChips from '../foods/ReasonChips'
import type { Client } from '../clients/types'
import SwapPanel from './SwapPanel'
import PrintMenu from './PrintMenu'
import TemplatePanel from './TemplatePanel'
import { useBrand } from '../settings/useBrand'

type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>

const field =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const btn = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-stone-100'
const TONE = { warn: 'bg-amber-100 text-amber-800', bad: 'bg-red-100 text-red-800' } as const

interface Props {
  client: Client
  result: CalcResult | null
  age: number | null
  food: FoodCtx
  /** Besin kodu -> danışana uygunluk */
  ev: Map<string, Evaluation>
  onChange: (patch: Partial<Client>) => void
}

export default function MenuEditor({ client, result, age, food, ev, onChange }: Props) {
  const { menu } = client
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Food | null>(null)
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('g')
  const [meal, setMeal] = useState<Meal>('Öğle')
  const [micro, setMicro] = useState(false)
  const [tplOpen, setTplOpen] = useState(false)
  const [swapIdx, setSwapIdx] = useState<number | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [printing, setPrinting] = useState(false)
  const { brand } = useBrand()
  const [toast, setToast] = useState('')

  const isHidden = (f: Food) => ev.get(f.code)?.st === 'hide'
  const T = totals(menu, food.byCode, food.idx)
  const results = searchForMenu(food.foods, q, 10, showHidden ? undefined : isHidden)
  const warns = warnList(result, age, T, menu.length)
  const badItems = menu.filter((it) => ev.get(it.code)?.st === 'hide')
  if (badItems.length)
    warns.push({ tone: 'bad', text: `Bu danışan için uygun olmayan ${badItems.length} ürün var: ${badItems.map((it) => shortName(food.byCode.get(it.code)?.name ?? '')).join(', ')}` })
  const ready = result && !result.infant && result.target != null

  const setMenu = (next: MenuItem[]) => onChange({ menu: next })
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(''), 1800)
  }

  const pick = (f: Food) => {
    const L = foodUnits(f, food.groups)
    setPicked(f)
    setUnit(L[0].u)
    setQty(L[0].u === 'g' ? '100' : '1')
  }
  const draft = picked ? makeItem(picked, food.groups, parseNum(qty) ?? 0, unit, meal) : null
  const draftT = picked && draft ? portion(picked, draft.g) : null

  const add = () => {
    if (!draft || !picked) return
    setMenu([...menu, draft])
    flash(`Menüye eklendi: ${shortName(picked.name)}`)
    setPicked(null)
    setQ('')
  }

  const edit = (i: number, patch: { q?: string; u?: string; meal?: Meal }) => {
    const it = menu[i]
    const F = food.byCode.get(it.code)
    if (!F) return
    const nextU = patch.u ?? it.u
    let nextQ = patch.q != null ? (parseNum(patch.q) ?? it.q) : it.q
    if (patch.u && patch.u !== it.u) nextQ = patch.u === 'g' ? it.g : 1
    const nit = makeItem(F, food.groups, nextQ, nextU, patch.meal ?? it.meal)
    setMenu(menu.map((x, k) => (k === i ? nit : x)))
  }

  const goals = ready
    ? (() => {
        const m = macros(result.target!, 50, 20)
        return [
          ['Enerji', T.kcal, result.target!, 'kcal'],
          ['Protein', T.p, m.proteinG, 'g'],
          ['Karb.', T.c, m.carbG, 'g'],
          ['Yağ', T.f, m.fatG, 'g'],
        ] as const
      })()
    : null

  const mealCount = (m: Meal) => menu.filter((x) => x.meal === m).length
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-sm font-semibold ${on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-600 hover:border-brand-500'}`

  return (
    <>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* Sol: hızlı besin ekleme (büyük ekranda sabit kalır) */}
      <aside className="space-y-4 xl:sticky xl:top-[112px] xl:max-h-[calc(100vh-128px)] xl:overflow-y-auto xl:pr-1">
        <section className="rounded-2xl border border-stone-200 bg-white p-4" aria-label="Besin ekle">
          <h2 className="font-display text-lg font-bold">Besin ekle</h2>
          <p className="mb-2 mt-0.5 text-xs text-stone-500">Önce öğünü seç, sonra besini ara.</p>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Eklenecek öğün">
            {MEALS.map((m) => (
              <button key={m} role="tab" aria-selected={meal === m} className={chip(meal === m)} onClick={() => setMeal(m)}>
                {m}{mealCount(m) > 0 && <span className="ml-1 opacity-75">({mealCount(m)})</span>}
              </button>
            ))}
          </div>
          <input
            className={`${field} mt-3 w-full`}
            placeholder="Besin ara: beyaz peynir, mercimek, simit…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPicked(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && results[0] && !picked) pick(results[0]) }}
          />
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-stone-600">
            <input type="checkbox" className="accent-brand-500" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
            Bu danışan için uygun olmayanları da göster
          </label>
          {q.trim() && !picked && (
            <div className="mt-2 space-y-1.5">
              {results.length === 0 && <p className="text-sm text-stone-500">Eşleşen besin yok.</p>}
              {results.map((f) => (
                <button key={f.id} onClick={() => pick(f)} className="flex w-full flex-wrap items-baseline gap-x-3 rounded-lg border border-stone-200 px-3 py-2 text-left hover:border-brand-500">
                  <b className="w-full text-sm">{shortName(f.name)}</b>
                  <span className="text-xs text-stone-500">{food.groups[f.groups[0]]} · {fmt(f.v[C.kcal] ?? 0)} kcal/100 g</span>
                  {ev.get(f.code)!.st !== 'ok' && <span className="w-full"><ReasonChips ev={ev.get(f.code)!} max={2} /></span>}
                </button>
              ))}
            </div>
          )}
          {picked && draft && draftT && (
            <div className="mt-3 rounded-xl border border-brand-500 bg-brand-50 p-3">
              <b>{shortName(picked.name)}</b>
              {ev.get(picked.code) && <ReasonChips ev={ev.get(picked.code)!} max={2} />}
              <div className="mt-3 grid grid-cols-[5.5rem_1fr] gap-2">
                <label className="block text-xs font-semibold">
                  Miktar
                  <input className={`${field} mt-1 w-full`} inputMode="decimal" maxLength={6} autoFocus value={qty}
                    onChange={(e) => setQty(e.target.value.replace(/[^0-9.,]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && add()} />
                </label>
                <label className="block text-xs font-semibold">
                  Ölçü
                  <select className={`${field} mt-1 w-full`} value={unit} onChange={(e) => { setUnit(e.target.value); setQty(e.target.value === 'g' ? '100' : '1') }}>
                    {foodUnits(picked, food.groups).map((x) => (
                      <option key={x.u} value={x.u}>{x.u === 'g' ? 'gram' : `${x.u} (${x.g} g)`}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-sm">
                <b>{fmt(draft.g)} g</b> · {fmt(draftT.kcal)} kcal · P {fmt(draftT.p, 1)} · K {fmt(draftT.c, 1)} · Y {fmt(draftT.f, 1)}
              </p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white" onClick={add}>{meal} öğününe ekle</button>
                <button className={btn} onClick={() => setPicked(null)}>Vazgeç</button>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-stone-500">
            Ev ölçüleri yaklaşık değerlerdir. TürKomp çiğ ve kuru besin değerleri içerir; pişmiş yemek tarifleri yoktur.
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4" aria-label="Hızlı işlemler">
          <h2 className="font-display text-lg font-bold">Hızlı işlemler</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white" onClick={() => setTplOpen(true)}>Şablon uygula</button>
            <button className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!menu.length} onClick={() => setPrinting(true)}>PDF liste</button>
            <button
              className={btn}
              disabled={!menu.length}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(menuTSV(menu, food.byCode))
                  flash('Menü panoya kopyalandı')
                } catch {
                  flash('Kopyalanamadı')
                }
              }}
            >
              Menüyü kopyala
            </button>
            <button className={btn} disabled={!menu.length} onClick={() => confirm('Tüm menü boşaltılsın mı?') && setMenu([])}>Menüyü boşalt</button>
          </div>
        </section>
      </aside>

      {/* Sağ: hedefler, uyarılar ve öğünler */}
      <div className="min-w-0 space-y-4">
        <div className="sticky top-[112px] z-[5] rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          {goals ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {goals.map(([label, v, target, unit]) => {
                const pc = target ? (v / target) * 100 : 0
                const tone = label === 'Enerji' ? (pc > 105 ? 'bg-red-700' : pc > 90 ? 'bg-amber-700' : 'bg-brand-500') : 'bg-brand-500'
                return (
                  <div key={label}>
                    <div className="text-xs font-semibold text-stone-500">{label}</div>
                    <div className="font-display text-xl font-bold tabular-nums">{fmt(v)}</div>
                    <div className="text-xs text-stone-500">/ {fmt(target)} {unit}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded bg-stone-100">
                      <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, pc)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 text-sm">
                {[['Enerji', T.kcal, 'kcal'], ['Protein', T.p, 'g'], ['Karb.', T.c, 'g'], ['Yağ', T.f, 'g']].map(([l, v, u]) => (
                  <div key={l as string}><div className="text-xs text-stone-500">{l}</div><b className="font-display text-xl">{fmt(v as number)}</b> {u}</div>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-500">Hedefle karşılaştırmak için danışanın cinsiyet, yaş, boy ve kilosunu tamamlayın.</p>
            </>
          )}
        </div>

        {warns.length > 0 && (
          <ul className="space-y-2">
            {warns.map((w) => (
              <li key={w.text} className={`rounded-xl p-3 text-sm ${TONE[w.tone]}`}>{w.text}</li>
            ))}
          </ul>
        )}

        {swapIdx !== null && menu[swapIdx] && (
          <SwapPanel
            key={swapIdx}
            food={food}
            hidden={isHidden}
            item={menu[swapIdx]}
            onClose={() => setSwapIdx(null)}
            onApply={(next) => {
              setMenu(menu.map((x, k) => (k === swapIdx ? next : x)))
              setSwapIdx(null)
              flash('Besin değiştirildi')
            }}
          />
        )}
        {tplOpen && (
          <TemplatePanel
            food={food}
            hidden={isHidden}
            result={result}
            sex={client.profile.sex}
            phys={client.profile.phys}
            menu={menu}
            onClose={() => setTplOpen(false)}
            onApply={(items, mode) => setMenu(mode === 'replace' ? items : [...menu, ...items])}
          />
        )}

        {/* Öğünler: boş öğünler de görünür, tek tıkla o öğüne eklemeye geçilir */}
        <div className="grid items-start gap-3 2xl:grid-cols-2">
          {MEALS.map((m) => {
            const rows = menu.map((it, i) => ({ it, i })).filter((x) => x.it.meal === m)
            const mt = totals(rows.map((x) => x.it), food.byCode, food.idx)
            const active = meal === m
            return (
              <section key={m} className={`rounded-2xl border bg-white p-4 ${active ? 'border-brand-500 ring-1 ring-brand-500' : 'border-stone-200'}`} aria-label={m}>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold">{m}</h2>
                  {rows.length > 0 && <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums">{fmt(mt.kcal)} kcal</span>}
                  <button className={`${btn} ml-auto`} onClick={() => { setMeal(m); document.querySelector<HTMLInputElement>('aside input[placeholder^="Besin ara"]')?.focus() }}>+ Ekle</button>
                </div>
                {rows.length === 0 && <p className="mt-2 rounded-lg border border-dashed border-stone-300 p-3 text-center text-sm text-stone-500">Bu öğüne henüz besin eklenmedi.</p>}
                {rows.map(({ it, i }) => {
                  const F = food.byCode.get(it.code)
                  if (!F) return null
                  const t = portion(F, it.g)
                  return (
                    <div key={i} className="mt-3 grid gap-2 border-t border-stone-100 pt-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0">
                        <b className="block truncate" title={shortName(F.name)}>{shortName(F.name)}</b>
                        {ev.get(F.code) && ev.get(F.code)!.st !== 'ok' && <ReasonChips ev={ev.get(F.code)!} max={2} />}
                        <div className="text-xs text-stone-500">
                          {fmt(t.kcal)} kcal · P {fmt(t.p, 1)} · K {fmt(t.c, 1)} · Y {fmt(t.f, 1)}{it.u !== 'g' && ` · ${fmt(it.g)} g`}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className={`${field} w-16`}
                          inputMode="decimal"
                          aria-label="Miktar"
                          defaultValue={String(it.q).replace('.', ',')}
                          key={`${i}-${it.g}-${it.u}`}
                          onBlur={(e) => edit(i, { q: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        />
                        <select className={`${field} min-w-0 max-w-28`} aria-label="Ölçü" value={it.u} onChange={(e) => edit(i, { u: e.target.value })}>
                          {foodUnits(F, food.groups).map((x) => <option key={x.u} value={x.u}>{x.u === 'g' ? 'gram' : x.u}</option>)}
                        </select>
                        <select className={`${field} max-w-28`} aria-label="Öğüne taşı" value={it.meal} onChange={(e) => edit(i, { meal: e.target.value as Meal })}>
                          {MEALS.map((x) => <option key={x}>{x}</option>)}
                        </select>
                        <button className={btn} title="Başka besinle değiştir" onClick={() => setSwapIdx(i)}>Değiştir</button>
                        <button className={`${btn} text-red-700`} aria-label="Kaldır" title="Kaldır" onClick={() => { setSwapIdx(null); setMenu(menu.filter((_, k) => k !== i)) }}>×</button>
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Mikro besin toplamları</h2>
            <button className={btn} onClick={() => setMicro(!micro)}>{micro ? 'Gizle' : 'Göster'}</button>
          </div>
          {micro && <MicroTable T={T} result={result} age={age} sex={client.profile.sex} />}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-display text-lg font-bold">Danışana not</h2>
          <p className="mb-2 text-xs text-stone-500">Yazdırılabilir listenin altında görünür (su, hareket, pişirme önerileri gibi).</p>
          <textarea className={`${field} min-h-24 w-full`} value={client.mnote} onChange={(e) => onChange({ mnote: e.target.value })} />
        </div>
      </div>
    </div>

    {printing && <PrintMenu client={client} menu={menu} food={food} brand={brand} target={result?.target ?? null} onClose={() => setPrinting(false)} />}
    {toast && (
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 shadow-lg">{toast}</div>
    )}
    </>
  )
}
function MicroTable({ T, result, age, sex }: { T: ReturnType<typeof totals>; result: CalcResult | null; age: number | null; sex: string }) {
  const showRef = !!result && result.adult && !result.infant && age != null
  const male = sex === 'E'
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead className="text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="py-1 text-left">Bileşen</th>
            <th className="py-1 text-right">Toplam</th>
            {showRef && <><th className="py-1 text-right">Referans</th><th className="py-1 text-right">%</th></>}
          </tr>
        </thead>
        <tbody>
          {MICRO.map(([label, comp, unit, ref]) => {
            const v = T.mic[comp] ?? 0
            const rf = showRef && ref ? ref(male, age!) : null
            return (
              <tr key={comp} className="border-t border-stone-100">
                <td className="py-1.5">{label}</td>
                <td className="py-1.5 text-right">{fmt(v, v < 10 ? 2 : 0)} {unit}</td>
                {showRef && (
                  <>
                    <td className="py-1.5 text-right">{rf ? `${fmt(rf, 1)} ${unit}` : '–'}</td>
                    <td className="py-1.5 text-right">{rf ? `%${fmt((v / rf) * 100)}` : '–'}</td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-stone-500">
        TürKomp'ta ölçülmemiş (boş) değerler 0 sayılır, toplamlar eksik kalabilir.{' '}
        {showRef ? 'Referans değerler yetişkinler için yaklaşık EFSA düzeyleridir; kişisel ihtiyaç farklı olabilir.' : 'Gebelik, emzirme ve 18 yaş altında referans karşılaştırması gösterilmez.'}
      </p>
    </div>
  )
}
