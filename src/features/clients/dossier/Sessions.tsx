import { useState } from 'react'
import { btn, btnPrimary, card, field } from '../../../components/ui/styles'
import { todayStr } from '../../../lib/appointments'
import { fmtDay, type SessionNote } from '../../../lib/dossier'

export default function SessionsCard({ sess, onChange }: { sess: SessionNote[]; onChange: (s: SessionNote[]) => void }) {
  const [d, setD] = useState(todayStr())
  const [t, setT] = useState('')
  const add = () => {
    if (!t.trim()) return
    onChange([...sess, { id: crypto.randomUUID(), d: d || todayStr(), t: t.trim() }])
    setT('')
  }
  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Seans notları</h2>
      <label className="mt-3 block text-xs font-semibold">Tarih<input type="date" className={`${field} mt-1 block`} value={d} onChange={(e) => setD(e.target.value)} /></label>
      <textarea className={`${field} mt-3 min-h-24 w-full`} placeholder="Bu görüşmede konuşulanlar, öneriler, bir sonraki hedef" value={t} onChange={(e) => setT(e.target.value)} />
      <button className={`${btnPrimary} mt-3`} disabled={!t.trim()} onClick={add}>Notu ekle</button>
      <div className="mt-4 space-y-3">
        {[...sess].sort((a, b) => (a.d < b.d ? 1 : -1)).map((s) => (
          <div key={s.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="mb-1 flex items-center justify-between"><b>{fmtDay(s.d)}</b><button className={btn} onClick={() => onChange(sess.filter((x) => x.id !== s.id))}>Sil</button></div>
            <div className="whitespace-pre-wrap text-sm">{s.t}</div>
          </div>
        ))}
      </div>
    </div>
  )
}