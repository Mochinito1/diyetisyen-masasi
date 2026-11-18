import { useRef, useState } from 'react'
import { todayStr } from '../../lib/appointments'
import { LAB_TESTS, fmtDay, labFlag, pnum, type LabResult } from '../../lib/dossier'
import { fmt } from '../../lib/format'
import { parseLabLines } from '../../lib/labParse'
import { pdfToLines } from '../../lib/pdfText'

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
  const fileRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [review, setReview] = useState<{ d: string; rows: { k: string; v: string; u: string; on: boolean }[]; note: string } | null>(null)

  /** PDF'i tarayıcıda okur, bulunan değerleri onay için listeler (hiçbir şey kendiliğinden kaydedilmez) */
  const readPdf = async (f: File | undefined) => {
    if (!f) return
    setReading(true)
    setReview(null)
    setErr('')
    try {
      const r = parseLabLines(await pdfToLines(f))
      setOpen(false)
      setReview({
        d: r.date ?? todayStr(),
        rows: r.found.map((x) => ({ k: x.k, v: String(x.v).replace('.', ','), u: x.u, on: true })),
        note: r.found.length ? '' : 'Bu PDF’den değer okunamadı. Taranmış ya da fotoğraf biçimindeki PDF’ler okunamaz; değerleri elle ekleyebilirsin.',
      })
    } catch (e) {
      setErr(e instanceof Error && e.message.includes('büyük') ? e.message : 'PDF okunamadı. Dosya bozuk veya şifreli olabilir.')
    } finally {
      setReading(false)
    }
  }
  const addReviewed = () => {
    if (!review) return
    const items: LabResult[] = []
    for (const r of review.rows) {
      const val = pnum(r.v, -1e6, 1e6)
      if (r.on && val != null) items.push({ id: crypto.randomUUID(), d: review.d || todayStr(), k: r.k, v: val, u: r.u.trim() })
    }
    if (!items.length) return setErr('Eklenecek değer seçilmedi')
    setErr('')
    onChange([...labs, ...items])
    setReview(null)
  }

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
        <button className="h-9 rounded-xl bg-brand-500 px-3.5 text-sm font-semibold text-white disabled:opacity-60" disabled={reading} onClick={() => fileRef.current?.click()}>
          {reading ? 'Okunuyor…' : 'PDF yükle'}
        </button>
        <button className="h-9 rounded-xl border border-brand-500 px-3.5 text-sm font-semibold text-brand-500 hover:bg-brand-50" aria-expanded={open} onClick={() => { setOpen(!open); setReview(null) }}>
          {open ? 'Kapat' : '+ Elle ekle'}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { void readPdf(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {!open && !review && labs.length === 0 && <p className="mt-1 text-xs text-stone-500">Laboratuvar PDF’ini yükle, değerleri senin için okuyalım.</p>}
      {err && !open && <p className="mt-2 text-sm text-red-700" role="alert">{err}</p>}

      {review && (
        <div className="mt-3 rounded-xl border border-brand-500 bg-brand-50 p-3" aria-label="PDF’den okunan değerler">
          {review.rows.length === 0 ? (
            <p className="text-sm">{review.note}</p>
          ) : (
            <>
              <div className="text-sm font-bold">PDF’de {review.rows.length} değer bulundu</div>
              <p className="text-xs text-stone-600">Kontrol et, yanlış olanın işaretini kaldır ya da değerini düzelt. Eklemeden önce hiçbir şey kaydedilmez.</p>
              <ul className="mt-2 space-y-1.5">
                {review.rows.map((r, i) => (
                  <li key={r.k} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2">
                    <input type="checkbox" className="h-4 w-4 flex-none accent-brand-500" checked={r.on} aria-label={`${r.k} ekle`}
                      onChange={(e) => setReview({ ...review, rows: review.rows.map((x, k) => (k === i ? { ...x, on: e.target.checked } : x)) })} />
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">{r.k}</span>
                    <input className="h-9 w-20 flex-none rounded-lg border border-stone-300 bg-white px-2 text-right text-sm tabular-nums focus:border-brand-500 focus:outline-none" inputMode="decimal" value={r.v} aria-label={`${r.k} değeri`}
                      onChange={(e) => setReview({ ...review, rows: review.rows.map((x, k) => (k === i ? { ...x, v: e.target.value.replace(/[^0-9.,-]/g, '') } : x)) })} />
                    <span className="w-14 flex-none text-xs text-stone-500">{r.u}</span>
                  </li>
                ))}
              </ul>
              <label className="mt-3 block text-xs font-semibold">Rapor tarihi
                <input type="date" className={field} value={review.d} onChange={(e) => setReview({ ...review, d: e.target.value })} />
              </label>
            </>
          )}
          <div className="mt-3 flex items-center gap-2">
            {review.rows.length > 0 && <button className="h-10 flex-1 rounded-xl bg-brand-500 px-4 font-semibold text-white" onClick={addReviewed}>Seçilenleri ekle</button>}
            <button className="h-10 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold hover:bg-stone-100" onClick={() => { setReview(null); setErr('') }}>{review.rows.length ? 'Vazgeç' : 'Kapat'}</button>
          </div>
          {err && <p className="mt-2 text-sm text-red-700" role="alert">{err}</p>}
          <p className="mt-2 text-[11px] text-stone-500">PDF yalnızca bu cihazda okunur; yüklenmez ve saklanmaz. Sadece onayladığın değerler kaydedilir.</p>
        </div>
      )}

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
        <p className="mt-3 text-sm text-stone-500">Henüz tahlil sonucu yok.</p>
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
