import { useState } from 'react'
import { btn, btnPrimary, card, field } from '../../../components/ui/styles'
import { todayStr } from '../../../lib/appointments'
import { LAB_TESTS, fmtDay, labFlag, pnum, type LabResult } from '../../../lib/dossier'
import { fmt } from '../../../lib/format'

export default function LabsCard({ labs, sex, onChange }: { labs: LabResult[]; sex: string; onChange: (l: LabResult[]) => void }) {
  const [d, setD] = useState(todayStr())
  const [test, setTest] = useState(LAB_TESTS[0][0])
  const [custom, setCustom] = useState('')
  const [v, setV] = useState('')
  const [u, setU] = useState(LAB_TESTS[0][1])
  const [err, setErr] = useState('')

  const latest = new Map<string, LabResult>()
  ;[...labs].sort((a, b) => (a.d < b.d ? -1 : 1)).forEach((x) => latest.set(x.k, x))

  const add = () => {
    const name = test === 'Diğer' ? custom.trim() : test
    const val = pnum(v, -1e6, 1e6)
    if (!name) return setErr('Tetkik adını yazın')
    if (val == null) return setErr('Geçerli bir değer girin')
    setErr('')
    onChange([...labs, { id: crypto.randomUUID(), d: d || todayStr(), k: name, v: val, u: u.trim() }])
    setV('')
  }

  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Kan tahlili sonuçları</h2>
      {latest.size > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...latest.values()].map((x) => {
            const fl = labFlag(x.k, x.v, sex)
            return (
              <span key={x.k} className={`rounded-full px-3 py-1 text-xs font-semibold ${fl ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {x.k}: {x.v == null ? '–' : fmt(x.v, 2)} {x.u}{fl && ` · ${fl}`}
              </span>
            )
          })}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold">Tarih<input type="date" className={`${field} mt-1 w-full`} value={d} onChange={(e) => setD(e.target.value)} /></label>
        <label className="block text-xs font-semibold">Tetkik
          <select className={`${field} mt-1 w-full`} value={test} onChange={(e) => { setTest(e.target.value); setU(LAB_TESTS.find((t) => t[0] === e.target.value)?.[1] ?? '') }}>
            {LAB_TESTS.map(([n]) => <option key={n}>{n}</option>)}
          </select>
        </label>
        {test === 'Diğer' && <label className="block text-xs font-semibold">Tetkik adı<input className={`${field} mt-1 w-full`} value={custom} onChange={(e) => setCustom(e.target.value)} /></label>}
        <label className="block text-xs font-semibold">Değer<input className={`${field} mt-1 w-full`} inputMode="decimal" maxLength={8} placeholder="Yazın" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,-]/g, ''))} /></label>
        <label className="block text-xs font-semibold">Birim<input className={`${field} mt-1 w-full`} value={u} onChange={(e) => setU(e.target.value)} /></label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className={btnPrimary} onClick={add}>Tahlil ekle</button>
        {err && <span className="text-sm text-red-700" role="alert">{err}</span>}
      </div>
      {labs.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs uppercase tracking-wide text-stone-500"><tr><th className="py-1 text-left">Tarih</th><th className="text-left">Tetkik</th><th className="text-right">Değer</th><th /></tr></thead>
            <tbody>
              {[...labs].sort((a, b) => (a.d < b.d ? 1 : -1)).map((x) => {
                const fl = labFlag(x.k, x.v, sex)
                return (
                  <tr key={x.id} className="border-t border-stone-100">
                    <td className="py-1.5">{fmtDay(x.d)}</td>
                    <td>{x.k}</td>
                    <td className="text-right">{x.v == null ? '–' : fmt(x.v, 2)} {x.u}{fl && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{fl}</span>}</td>
                    <td className="pl-2 text-right"><button className={btn} onClick={() => onChange(labs.filter((l) => l.id !== x.id))}>Sil</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-500">İşaretler genel referans eşiklerine göredir; laboratuvarın kendi aralığı esas alınmalıdır.</p>
        </div>
      )}
    </div>
  )
}