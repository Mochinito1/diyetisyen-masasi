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
import { load, save } from '../../lib/storage'
import type { Client } from '../clients/types'
import SwapPanel from './SwapPanel'
import PrintMenu from './PrintMenu'
import TemplatePanel from './TemplatePanel'
import { useBrand } from '../settings/useBrand'
import { todayStr } from '../../lib/appointments'
import { isFresh } from '../../lib/photos'
import { PhotoThumb } from '../portal/PortalPhotos'
import { useLiveTrack } from '../clients/useLiveTrack'

type FoodCtx = NonNullable<ReturnType<typeof useFoodData>>

const field =
  'rounded-xl border border-stone-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'
const actBtn = 'h-10 rounded-xl border border-stone-300 bg-white px-1.5 text-sm sm:h-9 sm:px-3.5 font-semibold hover:border-brand-500 hover:text-brand-500 disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:text-inherit'
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
  const liveTrk = useLiveTrack(client.id, client.trk)
  const todayPhotos = (liveTrk[todayStr()]?.ph ?? []).filter((p) => isFresh(p))
  const [toast, setToast] = useState('')
  const [warnOpen, setWarnOpen] = useState(false)
  const [rowMenu, setRowMenu] = useState<number | null>(null)
  const [recent, setRecent] = useState<string[]>(() => load<string[]>('dm.recentFoods', []))

  const isHidden = (f: Food) => ev.get(f.code)?.st === 'hide'
  const T = totals(menu, food.byCode, food.idx)
  const results = searchForMenu(food.foods, q, 10, showHidden ? undefined : isHidden)
  const warns = warnList(result, age, T, menu.length, client.macro ?? { c: 50, p: 20 })
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
    const nextRecent = [picked.code, ...recent.filter((x) => x !== picked.code)].slice(0, 8)
    setRecent(nextRecent)
    save('dm.recentFoods', nextRecent)
    flash(` öğününe eklendi: ${shortName(picked.name)}`)
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
        const m = macros(result.target!, client.macro?.c ?? 50, client.macro?.p ?? 20)
        return [
          ['Enerji', T.kcal, result.target!, 'kcal'],
          ['Protein', T.p, m.proteinG, 'g'],
          ['Karb.', T.c, m.carbG, 'g'],
          ['Yağ', T.f, m.fatG, 'g'],
        ] as const
      })()
    : null

  const mealCount = (m: Meal) => menu.filter((x) => x.meal === m).length
  const chip = (on: boolean) => `min-w-0 rounded-xl border px-1.5 py-2 text-center text-[13px] font-semibold leading-tight transition ${on ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-brand-500'}`

  return (
    <>
    <div className="space-y-4">
      {/* Özet: hedefler, uyarılar ve hızlı işlemler tek kartta */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-[112px] lg:z-[5]" aria-label="Günlük özet">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          <h2 className="font-display text-lg font-bold sm:mr-auto">Günlük özet</h2>
          <div className="grid w-full grid-cols-4 gap-1.5 sm:flex sm:w-auto">
          <button className={actBtn} onClick={() => setTplOpen(true)}>Şablon</button>
          <button className={actBtn} disabled={!menu.length} onClick={() => setPrinting(true)}>PDF liste</button>
          <button
            className={actBtn}
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
            Kopyala
          </button>
          <button className={`${actBtn} hover:!border-red-300 hover:!text-red-700`} disabled={!menu.length} onClick={() => confirm('Tüm menü boşaltılsın mı?') && setMenu([])}>Boşalt</button>
          </div>
        </div>
        {goals ? (
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
            {goals.map(([label, v, target, unit]) => {
              const pc = target ? (v / target) * 100 : 0
              const tone = label === 'Enerji' ? (pc > 105 ? 'bg-red-700' : pc > 90 ? 'bg-amber-700' : 'bg-brand-500') : 'bg-brand-500'
              return (
                <div key={label}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-stone-500">{label}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-stone-500">%{Math.round(pc)}</span>
                  </div>
                  <div className="font-display text-2xl font-bold leading-tight tabular-nums">{fmt(v)} <span className="text-xs font-semibold text-stone-500">/ {fmt(target)} {unit}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, pc)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[['Enerji', T.kcal, 'kcal'], ['Protein', T.p, 'g'], ['Karb.', T.c, 'g'], ['Yağ', T.f, 'g']].map(([l, v, u]) => (
                <div key={l as string}><div className="text-xs text-stone-500">{l}</div><b className="font-display text-xl">{fmt(v as number)}</b> {u}</div>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">Hedefle karşılaştırmak için danışanın cinsiyet, yaş, boy ve kilosunu tamamlayın.</p>
          </>
        )}
        {warns.length > 0 && (
          <div className="mt-3 border-t border-stone-100 pt-2">
            <button onClick={() => setWarnOpen(!warnOpen)} aria-expanded={warnOpen} className="flex w-full items-center gap-2 text-left text-sm">
              <span className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-bold ${warns.some((w) => w.tone === 'bad') ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{warns.length} uyarı</span>
              <span className="min-w-0 flex-1 truncate text-stone-500">{warns[0].text}</span>
              <span aria-hidden="true" className="text-stone-500">{warnOpen ? '▴' : '▾'}</span>
            </button>
            {warnOpen && (
              <ul className="mt-2 space-y-1.5">
                {warns.map((w) => <li key={w.text} className={`rounded-xl px-3 py-2 text-sm ${TONE[w.tone]}`}>{w.text}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>

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

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* Sağ (mobilde üstte): besin ekleme */}
        <aside className="xl:sticky xl:top-[112px] xl:order-2 xl:max-h-[calc(100vh-128px)] xl:overflow-y-auto" aria-label="Besin ekle">
          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold">Besin ekle</h2>
            <p className="mb-3 mt-0.5 text-xs text-stone-500">Önce öğünü seç, sonra besin veya yemek ara.</p>
            <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Eklenecek öğün">
              {(['Kahvaltı', 'Öğle', 'Akşam', 'Ara öğün 1', 'Ara öğün 2', 'Ara öğün 3'] as const).map((m) => (
                <button key={m} role="tab" aria-selected={meal === m} className={chip(meal === m)} onClick={() => setMeal(m)}>
                  <span className="block truncate">{m}</span>
                  <span className={`block text-[11px] font-semibold ${meal === m ? 'text-white/80' : 'text-stone-500'}`}>{mealCount(m) > 0 ? `${mealCount(m)} besin` : 'boş'}</span>
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
            {!q.trim() && !picked && recent.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">Son eklenenler</div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((code) => food.byCode.get(code)).filter((f): f is Food => !!f).map((f) => (
                    <button key={f.code} onClick={() => pick(f)} className="max-w-full truncate rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm hover:border-brand-500 hover:text-brand-500" title={f.name}>{shortName(f.name)}</button>
                  ))}
                </div>
              </div>
            )}
            {q.trim() && !picked && (
              <div className="mt-3 space-y-1.5">
                {results.length === 0 && <p className="text-sm text-stone-500">Eşleşen besin yok.</p>}
                {results.map((f) => (
                  <button key={f.id} onClick={() => pick(f)} className="flex w-full flex-wrap items-baseline gap-x-3 rounded-xl border border-stone-200 px-3 py-2 text-left hover:border-brand-500 hover:bg-brand-50">
                    <b className="w-full text-sm">{shortName(f.name)}</b>
                    <span className="text-xs text-stone-500">{f.portion ? `${f.cat} · 1 porsiyon ≈ ${fmt(((f.v[C.kcal] ?? 0) * f.portion) / 100)} kcal` : `${food.groups[f.groups[0]]} · ${fmt(f.v[C.kcal] ?? 0)} kcal/100 g`}</span>
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
                  <button className="h-10 flex-1 rounded-xl bg-brand-500 px-4 font-semibold text-white" onClick={add}>{meal} öğününe ekle</button>
                  <button className="h-10 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold hover:bg-stone-100" onClick={() => setPicked(null)}>Vazgeç</button>
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-stone-500">
              Ev ölçüleri yaklaşık değerlerdir. Besinler TürKomp'tan (çiğ/kuru), yemekler porsiyon listesinden gelir.
            </p>
          </section>
        </aside>

        {/* Sol: öğünler (hepsi aynı kart yapısında) */}
        <div className="min-w-0 space-y-4 xl:order-1">
          {MEALS.map((m) => {
            const rows = menu.map((it, i) => ({ it, i })).filter((x) => x.it.meal === m)
            const active = meal === m
            const focusAdd = () => { setMeal(m); document.querySelector<HTMLInputElement>('aside input[placeholder^="Besin ara"]')?.focus() }
            const mt = totals(rows.map((x) => x.it), food.byCode, food.idx)
            const share = ready && result.target && rows.length ? (mt.kcal / result.target) * 100 : null
            return (
              <section key={m} className={`rounded-2xl border bg-white ${active ? 'border-brand-500 ring-1 ring-brand-500' : 'border-stone-200'}`} aria-label={m}>
                <div className="flex items-center gap-3 rounded-t-2xl border-b border-stone-200 bg-stone-100 px-4 py-3.5">
                  <span className="h-10 w-1.5 flex-none rounded-full bg-brand-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight">{m}</h2>
                    <div className="text-xs text-stone-500">
                      {rows.length ? `${rows.length} besin · ${fmt(mt.kcal)} kcal${share != null ? ` · günlük hedefin %${Math.round(share)}` : ''}` : 'Henüz besin yok'}
                    </div>
                  </div>
                  <button className="ml-auto h-9 flex-none rounded-xl border border-brand-500 px-3.5 text-sm font-semibold text-brand-500 hover:bg-brand-50" onClick={focusAdd} aria-label={`${m} öğününe besin ekle`}>+ Ekle</button>
                </div>
                {share != null && (
                  <div className="mx-4 mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, share)}%` }} /></div>
                )}
                {rows.length > 0 && (
                  <ul className="mt-1 px-4 pb-2">
                    {rows.map(({ it, i }) => {
                      const F = food.byCode.get(it.code)
                      if (!F) return null
                      const t = portion(F, it.g)
                      return (
                        <li key={i} className="relative grid items-center gap-x-3 gap-y-2 border-t border-stone-100 py-3 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_20rem]">
                          <div className="min-w-0">
                            <b className="block truncate" title={shortName(F.name)}>{shortName(F.name)}</b>
                            {ev.get(F.code) && ev.get(F.code)!.st !== 'ok' && <ReasonChips ev={ev.get(F.code)!} max={2} />}
                            <div className="text-xs text-stone-500">P {fmt(t.p, 1)} · K {fmt(t.c, 1)} · Y {fmt(t.f, 1)}{it.u !== 'g' && ` · ${fmt(it.g)} g`}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              className={`${field} h-10 w-16 py-0 text-center`}
                              inputMode="decimal"
                              aria-label="Miktar"
                              defaultValue={String(it.q).replace('.', ',')}
                              key={`${i}-${it.g}-${it.u}`}
                              onBlur={(e) => edit(i, { q: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                            />
                            <select className={`${field} h-10 min-w-0 flex-1 truncate py-0 md:w-32 md:flex-none`} aria-label="Ölçü" value={it.u} onChange={(e) => edit(i, { u: e.target.value })}>
                              {foodUnits(F, food.groups).map((x) => <option key={x.u} value={x.u}>{x.u === 'g' ? 'gram' : x.u}</option>)}
                            </select>
                            <span className="w-16 flex-none text-right font-display text-base font-bold tabular-nums">{fmt(t.kcal)}<small className="ml-0.5 font-sans text-[11px] font-semibold text-stone-500">kcal</small></span>
                            <button className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-stone-300 font-bold hover:bg-stone-100" aria-label="Diğer işlemler" aria-expanded={rowMenu === i} onClick={() => setRowMenu(rowMenu === i ? null : i)}>⋯</button>
                          </div>
                          {rowMenu === i && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setRowMenu(null)} aria-hidden="true" />
                              <div className="absolute right-0 top-full z-20 mt-1 w-60 space-y-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                                <label className="block px-2 pt-1 text-xs font-semibold text-stone-500">Başka öğüne taşı
                                  <select className={`${field} mt-1 w-full py-1.5 text-sm text-stone-900`} value={it.meal} onChange={(e) => { edit(i, { meal: e.target.value as Meal }); setRowMenu(null) }}>
                                    {MEALS.map((x) => <option key={x}>{x}</option>)}
                                  </select>
                                </label>
                                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-stone-100" onClick={() => { setSwapIdx(i); setRowMenu(null) }}>⇄ Başka besinle değiştir</button>
                                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => { setRowMenu(null); setSwapIdx(null); setMenu(menu.filter((_, k) => k !== i)) }}>Kaldır</button>
                              </div>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {todayPhotos.some((p) => p.meal === m) && (
                  <div className="mx-4 mb-3 mt-1 rounded-xl bg-stone-100 p-2.5">
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">Danışanın bugünkü fotoğrafları</div>
                    <div className="flex flex-wrap gap-2">{todayPhotos.filter((p) => p.meal === m).map((p) => <PhotoThumb key={p.id} photo={p} size={72} />)}</div>
                  </div>
                )}
                {rows.length === 0 && <div className="h-3" />}
              </section>
            )
          })}

          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Mikro besin toplamları</h2>
              <button className={actBtn} onClick={() => setMicro(!micro)}>{micro ? 'Gizle' : 'Göster'}</button>
            </div>
            {micro && <MicroTable T={T} result={result} age={age} sex={client.profile.sex} />}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold">Danışana not</h2>
            <p className="mb-2 text-xs text-stone-500">Yazdırılabilir listenin altında görünür (su, hareket, pişirme önerileri gibi).</p>
            <textarea className={`${field} min-h-24 w-full`} value={client.mnote} onChange={(e) => onChange({ mnote: e.target.value })} />
          </section>
        </div>
      </div>
    </div>

    {printing && <PrintMenu client={client} menu={menu} food={food} brand={brand} target={result?.target ?? null} onClose={() => setPrinting(false)} />}
    {toast && (
      <div className="fixed bottom-5 max-md:bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 shadow-lg">{toast}</div>
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
