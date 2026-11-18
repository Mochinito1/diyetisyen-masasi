import { useState } from 'react'
import { todayStr } from '../../lib/appointments'
import { LAB_TESTS, fmtDay, labFlag, pnum, type LabResult } from '../../lib/dossier'
import { fmt } from '../../lib/format'

const field = 'mt-1 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-normal focus:border-brand-500 focus:outline-none'

/** Danışan portalı: küçük, tek düğmeli kan tahlili kartı. Eklenen sonuçlar en güncel değerleriyle listelenir. */
export default function PortalLabs({ labs, sex, onChange }: { labs: LabResult[]; sex: string; onChange: (l: LabResult[]) => void }) {
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const [d, setD] = useState(todayStr())
  const [test, setTest] = useState(LAB_TESTS[0][0])
  const [custom, setCustom] = useState('')
  const [v, setV] = useState('')
  const [u, setU] = useState(LAB_TESTS[0][1])
  const [err, setErr] = useState('')

  const latest = new Map<string, LabResult>()
  ;[...labs].sort((a, b) => (a.d < b.d ? -1 : 1)).forEach((x) => latest.set(x.k, x))
  const history = [...labs].sort((a, b) => (a.d < b.d ? 1 : -1))

  const add = () => {
    const name = test === 'Diğer' ? custom.trim() : test
    const val = pnum(v, -1e6, 1e6)
    if (!name) return setErr('Tetkik adını yazın')
    if (val == null) return setErr('Geçerli bir değer girin')
    setErr('')
    onChange([...labs, { id: crypto.randomUUID(), d: d || todayStr(), k: name, v: val, u: u.trim() }])
    setV('')
    setCustom('')
    setOpen(false)
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4" aria-label="Kan tahlili">
      <div className="flex items-center gap-3">
        <h2 className="mr-auto font-display text-lg font-bold">Kan tahlili</h2>
        <button className="h-9 rounded-xl border border-brand-500 px-3.5 text-sm font-semibold text-brand-500 hover:bg-brand-50" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Kapat' : '+ Kan tahlili ekle'}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block text-xs font-semibold">Tetkik
              <select className={field} value={test} onChange={(e) => { setTest(e.target.value); setU(LAB_TESTS.find((t) => t[0] === e.target.value)?.[1] ?? '') }}>
                {LAB_TESTS.map(([n]) => <option key={n}>{n}</option>)}
              </select>
            </label>
            {test === 'Diğer' && <label className="col-span-2 block text-xs font-semibold">Tetkik adı<input className={field} value={custom} onChange={(e) => setCustom(e.target.value)} /></label>}
            <label className="block text-xs font-semibold">Değer<input className={field} inputMode="decimal" maxLength={8} placeholder="Yazın" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,-]/g, ''))} onKeyDown={(e) => e.key === 'Enter' && add()} /></label>
            <label className="block text-xs font-semibold">Birim<input className={field} value={u} onChange={(e) => setU(e.target.value)} /></label>
            <label className="col-span-2 block text-xs font-semibold">Tarih<input type="date" className={field} value={d} onChange={(e) => setD(e.target.value)} /></label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button className="h-10 rounded-xl bg-brand-500 px-5 font-semibold text-white" onClick={add}>Ekle</button>
            {err && <span className="text-sm text-red-700" role="alert">{err}</span>}
          </div>
        </div>
      )}

      {latest.size === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Henüz tahlil sonucu eklemedin.</p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100 text-sm">
          {[...latest.values()].map((x) => {
            const fl = labFlag(x.k, x.v, sex)
            return (
              <li key={x.k} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <b className="block truncate font-semibold">{x.k}</b>
                  <span className="text-xs text-stone-500">{fmtDay(x.d)}</span>
                </span>
                {fl && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{fl}</span>}
                <span className="flex-none font-display text-base font-bold tabular-nums">{x.v == null ? '–' : fmt(x.v, 2)}<small className="ml-1 font-sans text-xs font-semibold text-stone-500">{x.u}</small></span>
              </li>
            )
          })}
        </ul>
      )}

      {history.length > latest.size && (
        <div className="mt-2">
          <button className="text-sm font-semibold text-brand-500 hover:underline" aria-expanded={all} onClick={() => setAll(!all)}>{all ? 'Geçmiş kayıtları gizle' : `Tüm kayıtlar (${history.length})`}</button>
        </div>
      )}
      {all && (
        <ul className="mt-2 divide-y divide-stone-100 text-sm">
          {history.map((x) => (
            <li key={x.id} className="flex items-center gap-2 py-1.5">
              <span className="w-24 flex-none text-xs text-stone-500">{fmtDay(x.d)}</span>
              <span className="min-w-0 flex-1 truncate">{x.k}</span>
              <span className="flex-none tabular-nums font-semibold">{x.v == null ? '–' : fmt(x.v, 2)} {x.u}</span>
              <button className="h-7 rounded-lg px-2 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => confirm('Bu kayıt silinsin mi?') && onChange(labs.filter((l) => l.id !== x.id))}>Sil</button>
            </li>
          ))}
        </ul>
      )}
      {labs.length > 0 && <p className="mt-2 text-xs text-stone-500">İşaretler genel referans eşiklerine göredir; laboratuvarın kendi aralığı esas alınmalıdır. Sonuçlar diyetisyeninle paylaşılır.</p>}
    </section>
  )
}
