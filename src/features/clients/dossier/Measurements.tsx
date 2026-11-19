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

      <div className="mt-3 grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <div className="flex min-w-0 flex-col">
      {/* Grafik: ölçüt seçimi eşit genişlikte düğmeler */}
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-5" role="group" aria-label="Grafik ölçütü">
        {(Object.keys(METRICS) as MetricKey[]).map((k, i) => (
          <button key={k} aria-pressed={chart === k} onClick={() => setChart(k)} className={`${i < 3 ? 'col-span-2' : 'col-span-3'} h-9 truncate sm:col-span-1 rounded-xl border px-1 text-sm font-semibold transition ${chart === k ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-brand-500'}`}>{METRICS[k].label}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-1 items-center rounded-xl border border-stone-200 p-2">
        {series.length ? <LineChart points={series} digits={mt.digits} unit={mt.unit} /> : <p className="p-4 text-center text-sm text-stone-500">Bu ölçüt için henüz veri yok.</p>}
      </div>

      </div>
      {/* Yeni ölçüm */}
      <section className="rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4" aria-label="Yeni ölçüm">
        <h3 className="text-sm font-bold">Yeni ölçüm</h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="col-span-2 block text-xs font-semibold">Tarih
            <input type="date" className={`${field} mt-1 w-full`} value={d} onChange={(e) => setD(e.target.value)} />
          </label>
          {input('w', 'Kilo (kg)')}{input('b', 'Bel (cm)')}{input('k', 'Kalça (cm)')}{input('y', 'Yağ oranı (%)')}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button className={`${btnPrimary} h-10 rounded-xl`} onClick={add}>Ölçüm ekle</button>
          <label className={`${btn} inline-flex h-10 cursor-pointer items-center justify-center rounded-xl`}>
            CSV içe aktar
            <input type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {msg && <span className="col-span-2 text-sm text-stone-500" role="status">{msg}</span>}
        </div>
        <p className="mt-2 text-xs text-stone-500">Tartı uygulamasından dışa aktarılan CSV alınabilir. Sütun adları: tarih, kilo, bel, kalça, yağ. Tarih 2026-11-16 veya 16.11.2026 olabilir.</p>
      </section>

      </div>
      {/* Geçmiş */}
      <h3 className="mt-5 text-sm font-bold">Ölçüm geçmişi</h3>
      {meas.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">Henüz ölçüm yok.</p>
      ) : (
        <>
          {/* Telefon: her ölçüm bir kart */}
          <div className="mt-2 space-y-2.5 sm:hidden">
            {meas.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => {
              const prev = [...meas.slice(0, i)].reverse().find((x) => x.w != null)
              const dl = m.w != null && prev?.w != null ? m.w - prev.w : null
              const wh = waistHip(m, sex)
              const cells: [string, string, boolean?][] = [
                ['Kilo', m.w != null ? fmt(m.w, 1) : '–'],
                ['BKİ', m.w != null && hm > 0.5 ? fmt(m.w / (hm * hm), 1) : '–'],
                ['Değişim', dl == null ? '–' : `${dl > 0 ? '+' : dl < 0 ? '−' : ''}${fmt(Math.abs(dl), 1)}`],
                ['Bel', m.b != null ? fmt(m.b, 1) : '–'],
                ['Kalça', m.k != null ? fmt(m.k, 1) : '–'],
                ['B/K', wh ? fmt(wh.ratio, 2) : '–', !!wh?.high],
                ['Yağ %', m.y != null ? fmt(m.y, 1) : '–'],
              ]
              return (
                <div key={m.d} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-center justify-between">
                    <b>{fmtDay(m.d)}</b>
                    <button className="h-8 rounded-lg px-2.5 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => onChange(meas.filter((x) => x.d !== m.d))}>Sil</button>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-x-2 gap-y-2 text-center">
                    {cells.map(([l, v, warn]) => (
                      <div key={l} className="rounded-lg bg-stone-50 px-1 py-1.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{l}</div>
                        <div className={`font-display text-base font-bold tabular-nums ${warn ? 'text-amber-800' : ''}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Geniş ekran: tablo */}
          <div className="mt-2 hidden overflow-x-auto sm:block">
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
          </div>
          <p className="mt-2 text-xs text-stone-500">Bel/kalça oranı {sex === 'E' ? '0,90' : '0,85'} üstünde ise işaretlenir (DSÖ abdominal obezite eşiği).</p>
        </>
      )}
    </div>
  )
}
