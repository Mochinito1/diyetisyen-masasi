import { useState } from 'react'
import LineChart from '../../../components/ui/LineChart'
import { btn, btnPrimary, card, field } from '../../../components/ui/styles'
import { todayStr } from '../../../lib/appointments'
import { METRICS, fmtDay, mergeMeas, parseCsv, pnum, seriesOf, waistHip, type Measurement, type MetricKey } from '../../../lib/dossier'
import { fmt } from '../../../lib/format'

interface Props {
  meas: Measurement[]
  sex: string
  heightCm: number | null
  /** ölçümler değişti; son kilo varsa profile de yansıtılır */
  onChange: (m: Measurement[]) => void
}

export default function MeasurementsCard({ meas, sex, heightCm, onChange }: Props) {
  const [chart, setChart] = useState<MetricKey>('w')
  const [d, setD] = useState(todayStr())
  const [vals, setVals] = useState({ w: '', b: '', k: '', y: '' })
  const [msg, setMsg] = useState('')
  const series = seriesOf(meas, chart)
  const mt = METRICS[chart]
  const hm = heightCm ? heightCm / 100 : 0

  const add = () => {
    const m: Measurement = { d: d || todayStr() }
    const w = pnum(vals.w, 2, 500), b = pnum(vals.b, 20, 300), k = pnum(vals.k, 20, 300), y = pnum(vals.y, 1, 70)
    if (w != null) m.w = w
    if (b != null) m.b = b
    if (k != null) m.k = k
    if (y != null) m.y = y
    if (Object.keys(m).length < 2) return setMsg('En az bir ölçüm değeri girin')
    onChange(mergeMeas(meas, [m]))
    setVals({ w: '', b: '', k: '', y: '' })
    setMsg('Ölçüm eklendi')
  }

  const importCsv = async (f: File | undefined) => {
    if (!f) return
    const r = parseCsv(await f.text())
    if (r.error) return setMsg(r.error)
    if (!r.rows.length) return setMsg('İçe aktarılacak satır bulunamadı')
    onChange(mergeMeas(meas, r.rows))
    setMsg(`${r.rows.length} ölçüm içe aktarıldı`)
  }

  const input = (k: keyof typeof vals, label: string) => (
    <label className="block text-xs font-semibold">{label}
      <input className={`${field} mt-1 w-full`} inputMode="decimal" maxLength={5} placeholder="Yazın" value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value.replace(/[^0-9.,]/g, '') })} />
    </label>
  )

  return (
    <div className={card}>
      <h2 className="font-display text-lg font-bold">Antropometri takibi</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(METRICS) as MetricKey[]).map((k) => (
          <button key={k} aria-pressed={chart === k} onClick={() => setChart(k)} className={`rounded-full border px-3 py-1 text-sm font-semibold ${chart === k ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 bg-white text-stone-600'}`}>{METRICS[k].label}</button>
        ))}
      </div>
      <div className="mt-3">
        {series.length ? <LineChart points={series} digits={mt.digits} unit={mt.unit} /> : <p className="text-sm text-stone-500">Bu ölçüt için henüz veri yok.</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <label className="block text-xs font-semibold">Tarih
          <input type="date" className={`${field} mt-1 w-full`} value={d} onChange={(e) => setD(e.target.value)} />
        </label>
        {input('w', 'Kilo (kg)')}{input('b', 'Bel (cm)')}{input('k', 'Kalça (cm)')}{input('y', 'Yağ oranı (%)')}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className={btnPrimary} onClick={add}>Ölçüm ekle</button>
        <label className={`${btn} cursor-pointer`}>
          Tartı/CSV içe aktar
          <input type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {msg && <span className="text-sm text-stone-500" role="status">{msg}</span>}
      </div>
      <p className="mt-2 text-xs text-stone-500">Tartı uygulamasından dışa aktarılan CSV alınabilir. Sütun adları: tarih, kilo, bel, kalça, yağ. Tarih 2026-11-16 veya 16.11.2026 olabilir.</p>

      {meas.length === 0 ? (
        <p className="mt-3 text-stone-500">Henüz ölçüm yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs uppercase tracking-wide text-stone-500">
              <tr>{['Tarih', 'Kilo', 'BKİ', 'Bel', 'Kalça', 'B/K', 'Yağ %', 'Kilo değ.', ''].map((h, i) => <th key={i} className={`py-1 ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {meas.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => {
                const prev = [...meas.slice(0, i)].reverse().find((x) => x.w != null)
                const dl = m.w != null && prev?.w != null ? m.w - prev.w : null
                const wh = waistHip(m, sex)
                return (
                  <tr key={m.d} className="border-t border-stone-100">
                    <td className="py-1.5">{fmtDay(m.d)}</td>
                    <td className="text-right">{m.w != null ? fmt(m.w, 1) : '–'}</td>
                    <td className="text-right">{m.w != null && hm > 0.5 ? fmt(m.w / (hm * hm), 1) : '–'}</td>
                    <td className="text-right">{m.b != null ? fmt(m.b, 1) : '–'}</td>
                    <td className="text-right">{m.k != null ? fmt(m.k, 1) : '–'}</td>
                    <td className={`text-right ${wh?.high ? 'font-bold text-amber-800' : ''}`}>{wh ? fmt(wh.ratio, 2) : '–'}</td>
                    <td className="text-right">{m.y != null ? fmt(m.y, 1) : '–'}</td>
                    <td className="text-right">{dl == null ? '–' : `${dl > 0 ? '+' : dl < 0 ? '−' : ''}${fmt(Math.abs(dl), 1)}`}</td>
                    <td className="pl-2 text-right"><button className={btn} onClick={() => onChange(meas.filter((x) => x.d !== m.d))}>Sil</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-500">Bel/kalça oranı {sex === 'E' ? '0,90' : '0,85'} üstünde ise işaretlenir (DSÖ abdominal obezite eşiği).</p>
        </div>
      )}
    </div>
  )
}