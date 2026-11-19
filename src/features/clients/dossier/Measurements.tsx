import { useState } from 'react'
import LineChart from '../../../components/ui/LineChart'
import { btn, btnPrimary, card, field } from '../../../components/ui/styles'
import { todayStr } from '../../../lib/appointments'
import { METRICS, fmtDay, mergeMeas, parseCsv, pnum, seriesOf, waistHip, type Measurement, type MetricKey } from '../../../lib/dossier'
import { fmt } from '../../../lib/format'

/** Ölçüm geçmişinde gösterilen son ölçüm sayısı (grafik tüm ölçümleri kullanır) */
const HISTORY_LIMIT = 3

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
      <h3 className="mt-5 text-sm font-bold">Ölçüm geçmişi <span className="font-normal text-stone-500">· son {HISTORY_LIMIT} ölçüm</span></h3>
      {meas.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">Henüz ölçüm yok.</p>
      ) : (
        <>
          {/* Telefon: zaman çizgisi, en yeni üstte; tarih belirgin, tüm değerler tek satırda */}
          <ol className="relative mt-3 sm:hidden">
            {meas.map((m, i) => ({ m, i })).reverse().slice(0, HISTORY_LIMIT).map(({ m, i }, n, arr) => {
              const prev = [...meas.slice(0, i)].reverse().find((x) => x.w != null)
              const dl = m.w != null && prev?.w != null ? m.w - prev.w : null
              const wh = waistHip(m, sex)
              const cells: [string, string, boolean?][] = [
                ['BKİ', m.w != null && hm > 0.5 ? fmt(m.w / (hm * hm), 1) : '–'],
                ['Bel', m.b != null ? fmt(m.b, 1) : '–'],
                ['Kalça', m.k != null ? fmt(m.k, 1) : '–'],
                ['B/K', wh ? fmt(wh.ratio, 2) : '–', !!wh?.high],
                ['Yağ %', m.y != null ? fmt(m.y, 1) : '–'],
              ]
              const down = dl != null && dl < 0
              return (
                <li key={m.d} className="relative flex gap-2.5 pb-3 last:pb-0">
                  {n < arr.length - 1 && <span className="absolute bottom-0 left-[7px] top-4 w-0.5 rounded bg-stone-200" aria-hidden="true" />}
                  <span className={`relative z-[1] mt-1 h-4 w-4 flex-none rounded-full border-[3px] border-stone-50 ${n === 0 ? 'bg-brand-500 ring-2 ring-brand-500/30' : 'bg-stone-300'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <b className="text-sm">{fmtDay(m.d)}</b>
                      {n === 0 && <span className="rounded-full bg-brand-50 px-1.5 py-px text-[10px] font-bold text-brand-500">son</span>}
                      <span className="ml-auto font-display text-lg font-bold leading-none tabular-nums">{m.w != null ? fmt(m.w, 1) : '–'}<small className="ml-0.5 font-sans text-[11px] font-semibold text-stone-500">kg</small></span>
                      {dl != null && dl !== 0 && <span className={`text-[11px] font-bold tabular-nums ${down ? 'text-emerald-700' : 'text-amber-800'}`}>{down ? '▼' : '▲'}{fmt(Math.abs(dl), 1)}</span>}
                      <button aria-label={`${fmtDay(m.d)} ölçümünü sil`} title="Sil" className="-mr-1 grid h-6 w-6 flex-none place-items-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-700" onClick={() => onChange(meas.filter((x) => x.d !== m.d))}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
                      </button>
                    </div>
                    <div className="mt-1.5 grid grid-cols-5 gap-1 border-t border-stone-100 pt-1.5 text-center">
                      {cells.map(([l, v, warn]) => (
                        <div key={l} className="min-w-0">
                          <div className="truncate text-[9.5px] font-semibold uppercase tracking-wide text-stone-500">{l}</div>
                          <div className={`text-[13px] font-bold tabular-nums ${warn ? 'text-amber-800' : v === '–' ? 'text-stone-400' : ''}`}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {/* Geniş ekran: tablo */}
          <div className="mt-2 hidden overflow-x-auto sm:block">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-xs uppercase tracking-wide text-stone-500">
                <tr>{['Tarih', 'Kilo', 'BKİ', 'Bel', 'Kalça', 'B/K', 'Yağ %', 'Kilo değ.', ''].map((h, i) => <th key={i} className={`py-1 ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {meas.map((m, i) => ({ m, i })).reverse().slice(0, HISTORY_LIMIT).map(({ m, i }) => {
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
