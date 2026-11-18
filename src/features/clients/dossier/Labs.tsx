import { useState } from 'react'
import { card } from '../../../components/ui/styles'
import { fmtDay, labFlag, type LabResult } from '../../../lib/dossier'
import { fmt } from '../../../lib/format'

/** Diyetisyen: kan tahlili eklemez; danışanın portaldan eklediği sonuçları yalnızca görüntüler. */
export default function LabsCard({ labs, sex }: { labs: LabResult[]; sex: string }) {
  const [open, setOpen] = useState(false)

  const latest = new Map<string, LabResult>()
  ;[...labs].sort((a, b) => (a.d < b.d ? -1 : 1)).forEach((x) => latest.set(x.k, x))
  const history = [...labs].sort((a, b) => (a.d < b.d ? 1 : -1))
  const flagged = [...latest.values()].filter((x) => labFlag(x.k, x.v, sex)).length

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-lg font-bold">Kan tahlili sonuçları</h2>
          <p className="text-xs text-stone-500">
            {labs.length === 0 ? 'Danışan henüz tahlil sonucu eklemedi.' : `${labs.length} kayıt${flagged ? ` · ${flagged} değer referans dışı` : ''}. Sonuçları danışan kendi portalından ekler.`}
          </p>
        </div>
        {labs.length > 0 && (
          <button className="h-10 rounded-xl border border-brand-500 px-4 text-sm font-semibold text-brand-500 hover:bg-brand-50" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Gizle' : 'Kan tahlillerini gör'}
          </button>
        )}
      </div>

      {open && labs.length > 0 && (
        <>
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
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {history.map((x) => {
              const fl = labFlag(x.k, x.v, sex)
              return (
                <li key={x.id} className="flex items-center gap-3 py-2">
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
          <p className="mt-2 text-xs text-stone-500">İşaretler genel referans eşiklerine göredir; laboratuvarın kendi aralığı esas alınmalıdır.</p>
        </>
      )}
    </div>
  )
}
